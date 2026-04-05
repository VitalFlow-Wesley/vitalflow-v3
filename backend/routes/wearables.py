import os
import uuid
import logging
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from database import db
from auth_utils import get_current_colaborador
from models import (
    WearableConnectionRequest, WearableConnectionResponse
)
from services import google_fit_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/wearables/connect", response_model=WearableConnectionResponse)
async def connect_wearable(data: WearableConnectionRequest, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        device = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "provider": data.provider,
            "device_name": data.device_name,
            "is_connected": True,
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wearable_devices.insert_one(device)
        return WearableConnectionResponse(
            id=device["id"], provider=device["provider"],
            device_name=device["device_name"],
            is_connected=device["is_connected"],
            last_sync=device["last_sync"], created_at=device["created_at"]
        )
    except Exception as e:
        logger.error(f"Error connecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wearables", response_model=List[WearableConnectionResponse])
async def get_wearables(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        devices = await db.wearable_devices.find(
            {"colaborador_id": colaborador["id"]}, {"_id": 0}
        ).to_list(100)
        return [
            WearableConnectionResponse(
                id=d["id"], provider=d["provider"],
                device_name=d["device_name"],
                is_connected=d["is_connected"],
                last_sync=d.get("last_sync"), created_at=d["created_at"]
            )
            for d in devices
        ]
    except Exception as e:
        logger.error(f"Error fetching wearables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/wearables/{device_id}")
async def disconnect_wearable(device_id: str, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        result = await db.wearable_devices.delete_one({
            "id": device_id, "colaborador_id": colaborador["id"]
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dispositivo nao encontrado")
        return {"status": "success", "message": "Dispositivo desconectado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wearables/google-fit/status")
async def google_fit_status():
    """Verifica se a integracao com Google Fit esta configurada."""
    return {
        "configured": google_fit_service.is_configured(),
        "message": "Google Fit configurado e pronto." if google_fit_service.is_configured()
                   else "Credenciais do Google Fit nao configuradas. Adicione GOOGLE_FIT_CLIENT_ID e GOOGLE_FIT_CLIENT_SECRET no .env."
    }


@router.get("/wearables/google-fit/auth")
async def google_fit_auth(request: Request):
    """Inicia fluxo OAuth real do Google Fit (quando configurado)."""
    colaborador = await get_current_colaborador(request)
    if not google_fit_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Fit nao configurado. Credenciais OAuth pendentes.")
    auth_url = google_fit_service.get_auth_url(state=colaborador["id"])
    return {"auth_url": auth_url}


@router.get("/wearables/google-fit/callback")
async def google_fit_callback(code: str = "", state: str = ""):
    """Callback do OAuth do Google Fit. Troca code por tokens e sincroniza dados."""
    if not code or not state:
        raise HTTPException(status_code=400, detail="Parametros invalidos no callback.")

    tokens = await google_fit_service.exchange_code(code)
    if not tokens:
        raise HTTPException(status_code=502, detail="Falha ao trocar codigo por token no Google.")

    # Save tokens persistently
    await db.wearable_tokens.update_one(
        {"colaborador_id": state, "provider": "google_health_connect"},
        {"$set": {
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "expires_in": tokens.get("expires_in"),
            "token_type": tokens.get("token_type", "Bearer"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    # Create/update device record (use google_health_connect to match frontend)
    existing = await db.wearable_devices.find_one(
        {"colaborador_id": state, "provider": {"$in": ["google_fit", "google_health_connect"]}}, {"_id": 0}
    )
    if existing:
        await db.wearable_devices.update_one(
            {"id": existing["id"]},
            {"$set": {"is_connected": True, "provider": "google_health_connect", "last_sync": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        device = {
            "id": str(uuid.uuid4()), "colaborador_id": state,
            "provider": "google_health_connect", "device_name": "Google Fit",
            "is_connected": True, "last_sync": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wearable_devices.insert_one(device)

    # Ativar Premium Trial 7 dias no primeiro vinculo com wearable
    colab = await db.colaboradores.find_one({"id": state}, {"_id": 0, "is_premium": 1, "premium_expires_at": 1})
    if colab and not colab.get("is_premium") and not colab.get("premium_expires_at"):
        from datetime import timedelta
        trial_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.colaboradores.update_one(
            {"id": state},
            {"$set": {"is_premium": True, "premium_expires_at": trial_expires, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )

    # Fetch initial biometrics
    biometrics = await google_fit_service.fetch_biometrics(tokens.get("access_token"))
    if biometrics:
        biometrics["colaborador_id"] = state
        biometrics["synced_at"] = datetime.now(timezone.utc).isoformat()
        await db.google_fit_data.insert_one(biometrics)

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend_url}/devices?google_fit=success")


@router.post("/wearables/oauth/callback")
async def wearable_oauth_callback(request: Request):
    try:
        import random
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        provider = body.get("provider", "google_health_connect")

        sync_data = {
            "hrv": random.randint(35, 85),
            "bpm": random.randint(58, 110),
            "bpm_average": random.randint(60, 80),
            "sleep_hours": round(random.uniform(4.5, 9.0), 1),
            "steps": random.randint(2000, 15000),
            "source": provider
        }

        existing = await db.wearable_devices.find_one(
            {"colaborador_id": colaborador["id"], "provider": provider}, {"_id": 0}
        )
        device_id = existing["id"] if existing else str(uuid.uuid4())

        if existing:
            await db.wearable_devices.update_one(
                {"id": device_id},
                {"$set": {"is_connected": True, "last_sync": datetime.now(timezone.utc).isoformat(), "oauth_token": "mock-token"}}
            )
        else:
            device = {
                "id": device_id,
                "colaborador_id": colaborador["id"],
                "provider": provider,
                "device_name": f"{provider.replace('_', ' ').title()}",
                "is_connected": True,
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "oauth_token": "mock-token",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wearable_devices.insert_one(device)

        # Ativar Premium Trial no primeiro vinculo
        await _activate_premium_trial_on_first_wearable(colaborador["id"])

        return {
            "status": "authorized", "device_id": device_id,
            "provider": provider, "sync_data": sync_data,
            "message": f"Dispositivo {provider} autorizado e sincronizado automaticamente."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def _activate_premium_trial_on_first_wearable(colaborador_id: str):
    """Ativa Premium Trial 7 dias no primeiro vinculo com wearable."""
    colab = await db.colaboradores.find_one(
        {"id": colaborador_id}, {"_id": 0, "is_premium": 1, "premium_expires_at": 1}
    )
    if colab and not colab.get("is_premium") and not colab.get("premium_expires_at"):
        from datetime import timedelta
        trial_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.colaboradores.update_one(
            {"id": colaborador_id},
            {"$set": {"is_premium": True, "premium_expires_at": trial_expires, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )


@router.post("/wearables/sync")
async def sync_wearable_data(request: Request):
    """Sincronizacao em background: busca dados reais do Google Fit, detecta exercicio e auto-analisa."""
    try:
        colaborador = await get_current_colaborador(request)
        cid = colaborador["id"]

        token_doc = await db.wearable_tokens.find_one(
            {"colaborador_id": cid, "provider": "google_health_connect"}, {"_id": 0}
        )
        if not token_doc or not token_doc.get("access_token"):
            raise HTTPException(status_code=404, detail="Nenhum token salvo. Conecte o Google Fit primeiro.")

        access_token = token_doc["access_token"]
        refresh_token = token_doc.get("refresh_token")

        # Tenta buscar dados com o access_token atual
        biometrics = await google_fit_service.fetch_biometrics(access_token)

        # Se falhou e tem refresh_token, tenta renovar
        if not biometrics and refresh_token:
            new_tokens = await google_fit_service.refresh_access_token(refresh_token)
            if new_tokens and new_tokens.get("access_token"):
                access_token = new_tokens["access_token"]
                await db.wearable_tokens.update_one(
                    {"colaborador_id": cid, "provider": "google_health_connect"},
                    {"$set": {
                        "access_token": access_token,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                biometrics = await google_fit_service.fetch_biometrics(access_token)

        if biometrics:
            biometrics["colaborador_id"] = cid
            biometrics["synced_at"] = datetime.now(timezone.utc).isoformat()
            await db.google_fit_data.insert_one(biometrics)

            # Atualiza last_sync no device
            await db.wearable_devices.update_one(
                {"colaborador_id": cid, "provider": "google_health_connect"},
                {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
            )

            # ── Auto-analise com dados reais ──
            analysis_result = None
            if biometrics.get("has_real_data") and biometrics.get("bpm"):
                from services.ai_service import analyze_biometrics, classify_activity, calculate_sleep_recovery
                from models import BiometricInput, Analysis

                sleep_h = biometrics.get("sleep_hours", 7)
                steps = biometrics.get("steps", 0)
                bpm = biometrics.get("bpm", 70)
                hrv = biometrics.get("hrv", 50)
                bpm_avg = biometrics.get("bpm_average", 70)

                # Deteccao de exercicio vs estresse
                activity_analysis = biometrics.get("activity_analysis", {})
                exercise_detected = activity_analysis.get("exercise_detected", False)
                avg_steps_per_hour = steps // 24 if steps > 0 else 0
                activity_ctx = classify_activity(bpm, steps, avg_steps_per_hour)

                # Recuperacao por sono
                recovery = calculate_sleep_recovery(sleep_h, biometrics.get("sleep_quality"))

                # Preparar input para analise
                input_data = BiometricInput(
                    hrv=max(0, min(200, hrv)),
                    bpm=max(40, min(200, bpm)),
                    bpm_average=max(40, min(120, bpm_avg)),
                    sleep_hours=min(24, sleep_h),
                    cognitive_load=5,
                    colaborador_id=cid,
                    user_name=colaborador.get("nome", "Colaborador"),
                    age=30
                )

                ai_result = await analyze_biometrics(input_data, activity_ctx, recovery)

                # Salvar analise
                analysis = Analysis(
                    v_score=ai_result["v_score"],
                    area_afetada=ai_result["area_afetada"],
                    status_visual=ai_result["status_visual"],
                    tag_rapida=ai_result["tag_rapida"],
                    causa_provavel=ai_result["causa_provavel"],
                    nudge_acao=ai_result["nudge_acao"],
                    input_data=input_data,
                    colaborador_id=cid
                )
                doc = analysis.model_dump()
                doc['timestamp'] = doc['timestamp'].isoformat()
                doc['input_data'] = input_data.model_dump()
                doc['source'] = 'google_fit_auto'
                doc['activity_context'] = activity_ctx
                doc['recovery'] = recovery
                doc['real_data'] = {
                    "steps": steps,
                    "sleep_hours": sleep_h,
                    "exercise_detected": exercise_detected,
                    "exercise_hours": activity_analysis.get("total_exercise_hours", 0),
                    "stress_periods": activity_analysis.get("total_stress_hours", 0),
                }
                await db.analyses.insert_one(doc)

                analysis_result = {
                    "v_score": ai_result["v_score"],
                    "status_visual": ai_result["status_visual"],
                    "tag_rapida": ai_result["tag_rapida"],
                    "exercise_detected": exercise_detected,
                    "recovery_label": recovery["label"],
                    "sleep_hours": sleep_h,
                    "steps": steps,
                }

            safe_biometrics = {k: v for k, v in biometrics.items() if k not in ("_id", "hourly_bpm", "hourly_steps")}
            return {
                "status": "synced",
                "has_real_data": biometrics.get("has_real_data", False),
                "data": safe_biometrics,
                "auto_analysis": analysis_result,
            }

        return {"status": "no_data", "message": "Nenhum dado novo disponivel do Google Fit."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing wearable data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

