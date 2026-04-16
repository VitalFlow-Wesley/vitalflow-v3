import os
import uuid
import random
import logging
from typing import List
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse

from database import db
from auth_utils import get_current_colaborador
from models import WearableConnectionRequest, WearableConnectionResponse
from services import google_fit_service
from core_engine import process_analysis, calculate_baseline

logger = logging.getLogger(__name__)
router = APIRouter()


def get_mock_scenario(name: str):
    scenarios = {
        "stable": {
            "hrv": 72,
            "bpm": 64,
            "bpm_average": 66,
            "sleep_hours": 8.1,
            "steps": 9400,
            "sleep_quality": "boa",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": False,
                "total_exercise_hours": 0,
                "total_stress_hours": 1,
            },
            "source": "mock_stable",
        },
        "stress_high": {
            "hrv": 28,
            "bpm": 108,
            "bpm_average": 92,
            "sleep_hours": 5.2,
            "steps": 3100,
            "sleep_quality": "ruim",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": False,
                "total_exercise_hours": 0,
                "total_stress_hours": 8,
            },
            "source": "mock_stress_high",
        },
        "sleep_poor": {
            "hrv": 38,
            "bpm": 86,
            "bpm_average": 80,
            "sleep_hours": 4.3,
            "steps": 4200,
            "sleep_quality": "ruim",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": False,
                "total_exercise_hours": 0,
                "total_stress_hours": 5,
            },
            "source": "mock_sleep_poor",
        },
        "recovery_good": {
            "hrv": 81,
            "bpm": 58,
            "bpm_average": 61,
            "sleep_hours": 8.7,
            "steps": 7600,
            "sleep_quality": "excelente",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": False,
                "total_exercise_hours": 0,
                "total_stress_hours": 1,
            },
            "source": "mock_recovery_good",
        },
        "fatigue_risk": {
            "hrv": 31,
            "bpm": 96,
            "bpm_average": 89,
            "sleep_hours": 5.0,
            "steps": 2600,
            "sleep_quality": "regular",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": False,
                "total_exercise_hours": 0,
                "total_stress_hours": 7,
            },
            "source": "mock_fatigue_risk",
        },
        "exercise_mode": {
            "hrv": 55,
            "bpm": 126,
            "bpm_average": 78,
            "sleep_hours": 7.4,
            "steps": 14300,
            "sleep_quality": "boa",
            "has_real_data": True,
            "activity_analysis": {
                "exercise_detected": True,
                "total_exercise_hours": 2,
                "total_stress_hours": 1,
            },
            "source": "mock_exercise_mode",
        },
    }

    if name == "random":
        return random.choice(list(scenarios.values()))

    return scenarios.get(name, scenarios["stable"])


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
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        await db.wearable_devices.insert_one(device)

        return WearableConnectionResponse(
            id=device["id"],
            provider=device["provider"],
            device_name=device["device_name"],
            is_connected=device["is_connected"],
            last_sync=device["last_sync"],
            created_at=device["created_at"],
        )
    except Exception as e:
        logger.error(f"Error connecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wearables", response_model=List[WearableConnectionResponse])
async def get_wearables(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        devices = await db.wearable_devices.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0},
        ).to_list(100)

        return [
            WearableConnectionResponse(
                id=d["id"],
                provider=d["provider"],
                device_name=d["device_name"],
                is_connected=d["is_connected"],
                last_sync=d.get("last_sync"),
                created_at=d["created_at"],
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
        result = await db.wearable_devices.delete_one(
            {"id": device_id, "colaborador_id": colaborador["id"]}
        )

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
    configured = google_fit_service.is_configured()
    return {
        "configured": configured,
        "message": (
            "Google Fit configurado e pronto."
            if configured
            else "Credenciais do Google Fit nao configuradas. Adicione GOOGLE_FIT_CLIENT_ID e GOOGLE_FIT_CLIENT_SECRET no .env."
        ),
    }


@router.get("/wearables/google-fit/auth")
async def google_fit_auth(request: Request):
    colaborador = await get_current_colaborador(request)

    if not google_fit_service.is_configured():
        raise HTTPException(
            status_code=501,
            detail="Google Fit nao configurado. Credenciais OAuth pendentes.",
        )

    auth_url = google_fit_service.get_auth_url(state=colaborador["id"])
    return {"auth_url": auth_url}


@router.get("/wearables/google-fit/callback")
async def google_fit_callback(code: str = "", state: str = ""):
    if not code or not state:
        raise HTTPException(status_code=400, detail="Parametros invalidos no callback.")

    tokens = await google_fit_service.exchange_code(code)
    if not tokens:
        raise HTTPException(
            status_code=502,
            detail="Falha ao trocar codigo por token no Google.",
        )

    await db.wearable_tokens.update_one(
        {"colaborador_id": state, "provider": "google_health_connect"},
        {
            "$set": {
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in"),
                "token_type": tokens.get("token_type", "Bearer"),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )

    existing = await db.wearable_devices.find_one(
        {
            "colaborador_id": state,
            "provider": {"$in": ["google_fit", "google_health_connect"]},
        },
        {"_id": 0},
    )

    if existing:
        await db.wearable_devices.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "is_connected": True,
                    "provider": "google_health_connect",
                    "last_sync": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
    else:
        device = {
            "id": str(uuid.uuid4()),
            "colaborador_id": state,
            "provider": "google_health_connect",
            "device_name": "Google Fit",
            "is_connected": True,
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.wearable_devices.insert_one(device)

    colab = await db.colaboradores.find_one(
        {"id": state},
        {"_id": 0, "is_premium": 1, "premium_expires_at": 1},
    )

    if colab and not colab.get("is_premium") and not colab.get("premium_expires_at"):
        trial_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.colaboradores.update_one(
            {"id": state},
            {
                "$set": {
                    "is_premium": True,
                    "premium_expires_at": trial_expires,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

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
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        provider = body.get("provider", "google_health_connect")

        sync_data = {
            "hrv": random.randint(35, 85),
            "bpm": random.randint(58, 110),
            "bpm_average": random.randint(60, 80),
            "sleep_hours": round(random.uniform(4.5, 9.0), 1),
            "steps": random.randint(2000, 15000),
            "source": provider,
        }

        existing = await db.wearable_devices.find_one(
            {"colaborador_id": colaborador["id"], "provider": provider},
            {"_id": 0},
        )
        device_id = existing["id"] if existing else str(uuid.uuid4())

        if existing:
            await db.wearable_devices.update_one(
                {"id": device_id},
                {
                    "$set": {
                        "is_connected": True,
                        "last_sync": datetime.now(timezone.utc).isoformat(),
                        "oauth_token": "mock-token",
                    }
                },
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
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.wearable_devices.insert_one(device)

        await _activate_premium_trial_on_first_wearable(colaborador["id"])

        return {
            "status": "authorized",
            "device_id": device_id,
            "provider": provider,
            "sync_data": sync_data,
            "message": f"Dispositivo {provider} autorizado e sincronizado automaticamente.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def _activate_premium_trial_on_first_wearable(colaborador_id: str):
    colab = await db.colaboradores.find_one(
        {"id": colaborador_id},
        {"_id": 0, "is_premium": 1, "premium_expires_at": 1},
    )
    if colab and not colab.get("is_premium") and not colab.get("premium_expires_at"):
        trial_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        await db.colaboradores.update_one(
            {"id": colaborador_id},
            {
                "$set": {
                    "is_premium": True,
                    "premium_expires_at": trial_expires,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )


@router.post("/wearables/sync")
async def sync_wearable_data(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        cid = colaborador["id"]

        body = {}
        try:
            body = await request.json()
            if not isinstance(body, dict):
                body = {}
        except Exception:
            body = {}

        scenario = body.get("scenario", "random")

        token_doc = await db.wearable_tokens.find_one(
            {"colaborador_id": cid, "provider": "google_health_connect"},
            {"_id": 0},
        )

        biometrics = None
        access_token = None
        refresh_token = None

        if token_doc and token_doc.get("access_token") and scenario in (None, "", "real"):
            access_token = token_doc["access_token"]
            refresh_token = token_doc.get("refresh_token")

            biometrics = await google_fit_service.fetch_biometrics(access_token)

            if not biometrics and refresh_token:
                new_tokens = await google_fit_service.refresh_access_token(refresh_token)
                if isinstance(new_tokens, dict) and new_tokens.get("access_token"):
                    access_token = new_tokens["access_token"]

                    await db.wearable_tokens.update_one(
                        {"colaborador_id": cid, "provider": "google_health_connect"},
                        {
                            "$set": {
                                "access_token": access_token,
                                "updated_at": datetime.now(timezone.utc).isoformat(),
                            }
                        },
                    )

                    biometrics = await google_fit_service.fetch_biometrics(access_token)

        if not isinstance(biometrics, dict):
            biometrics = get_mock_scenario(scenario or "random")

        biometrics["colaborador_id"] = cid
        biometrics["synced_at"] = datetime.now(timezone.utc).isoformat()
        biometrics["scenario"] = scenario or "random"

        await db.google_fit_data.insert_one(biometrics)

        await db.wearable_devices.update_one(
            {"colaborador_id": cid, "provider": "google_health_connect"},
            {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}},
        )

        analysis_result = None

        if biometrics.get("has_real_data") and biometrics.get("bpm"):
            from services.ai_service import (
                analyze_biometrics,
                classify_activity,
                calculate_sleep_recovery,
            )
            from models import BiometricInput, Analysis

            sleep_h = biometrics.get("sleep_hours", 7)
            steps = biometrics.get("steps", 0)
            bpm = biometrics.get("bpm", 70)
            hrv = biometrics.get("hrv", 50)
            bpm_avg = biometrics.get("bpm_average", 70)

            activity_analysis = biometrics.get("activity_analysis", {})
            if not isinstance(activity_analysis, dict):
                activity_analysis = {}

            exercise_detected = activity_analysis.get("exercise_detected", False)
            total_exercise_hours = activity_analysis.get("total_exercise_hours", 0)
            total_stress_hours = activity_analysis.get("total_stress_hours", 0)
            avg_steps_per_hour = steps // 24 if steps > 0 else 0

            try:
                activity_ctx_raw = classify_activity(bpm, steps, avg_steps_per_hour)
                if isinstance(activity_ctx_raw, dict):
                    activity_ctx = activity_ctx_raw
                else:
                    activity_ctx = {"label": str(activity_ctx_raw)}
            except Exception:
                activity_ctx = {"label": "unknown"}

            try:
                recovery_raw = calculate_sleep_recovery(
                    sleep_h,
                    biometrics.get("sleep_quality"),
                )
                if isinstance(recovery_raw, dict):
                    recovery = recovery_raw
                else:
                    recovery = {
                        "label": str(recovery_raw),
                        "score": 0,
                    }
            except Exception:
                recovery = {
                    "label": "unknown",
                    "score": 0,
                }

            history = await db.analyses.find(
                {"colaborador_id": cid},
                {"_id": 0, "v_score": 1, "input_data": 1, "timestamp": 1},
            ).sort("timestamp", -1).to_list(20)

            history_data = []
            history_scores = []

            for h in history:
                if not isinstance(h, dict):
                    continue

                input_data_hist = h.get("input_data", {})
                if not isinstance(input_data_hist, dict):
                    input_data_hist = {}

                history_data.append(
                    {
                        "bpm": input_data_hist.get("bpm", 70),
                        "hrv": input_data_hist.get("hrv", 50),
                    }
                )

                if h.get("v_score") is not None:
                    history_scores.append(h["v_score"])

            baseline = calculate_baseline(history_data)
            history_avg = (
                sum(history_scores) / len(history_scores)
                if history_scores
                else None
            )

            engine_result = process_analysis(
                {"bpm": bpm, "hrv": hrv},
                baseline,
                history_avg,
            )

            if not isinstance(engine_result, dict):
                engine_result = {
                    "v_score": 50,
                    "status_visual": "Atenção",
                    "stress_score": 50,
                    "recovery_score": 50,
                    "risk_score": 50,
                    "contexto": "unknown",
                    "alert": None,
                }

            input_data = BiometricInput(
                hrv=max(0, min(200, hrv)),
                bpm=max(40, min(200, bpm)),
                bpm_average=max(40, min(120, bpm_avg)),
                sleep_hours=min(24, sleep_h),
                cognitive_load=5,
                colaborador_id=cid,
                user_name=colaborador.get("nome", "Colaborador"),
                age=30,
            )

            try:
                ai_result_raw = await analyze_biometrics(input_data, activity_ctx, recovery)
            except TypeError:
                ai_result_raw = await analyze_biometrics(input_data)
            except Exception:
                ai_result_raw = None

            if isinstance(ai_result_raw, dict):
                ai_result = ai_result_raw
            else:
                ai_result = {
                    "v_score": engine_result.get("v_score", 50),
                    "area_afetada": [],
                    "status_visual": engine_result.get("status_visual", "Atenção"),
                    "tag_rapida": "Analise automatica",
                    "causa_provavel": "Processamento automatico do VitalFlow.",
                    "nudge_acao": "Continue monitorando seus dados.",
                }

            final_v_score = int(round(
    (
        ai_result.get("v_score", engine_result.get("v_score", 50))
        + engine_result.get("v_score", 50)
    ) / 2
))

            analysis = Analysis(
                v_score=final_v_score,
                area_afetada=ai_result.get("area_afetada", []),
                status_visual=engine_result.get("status_visual", "Atenção"),
                tag_rapida=ai_result.get("tag_rapida", "Analise automatica"),
                causa_provavel=ai_result.get("causa_provavel", "Sem causa definida"),
                nudge_acao=ai_result.get(
                    "nudge_acao", "Continue monitorando seus dados."
                ),
                input_data=input_data,
                colaborador_id=cid,
            )

            doc = analysis.model_dump()
            doc["timestamp"] = doc["timestamp"].isoformat()
            doc["input_data"] = input_data.model_dump()
            doc["source"] = biometrics.get("source", "google_fit_auto")
            doc["scenario"] = biometrics.get("scenario", "random")
            doc["activity_context"] = activity_ctx
            doc["recovery"] = recovery
            doc["engine"] = engine_result
            doc["real_data"] = {
                "steps": steps,
                "sleep_hours": sleep_h,
                "exercise_detected": exercise_detected,
                "exercise_hours": total_exercise_hours,
                "stress_periods": total_stress_hours,
            }

            await db.analyses.insert_one(doc)

            analysis_result = {
    "v_score": final_v_score,
    "status_visual": engine_result.get("status_visual", "Atenção"),
    "tag_rapida": ai_result.get("tag_rapida", "Analise automatica"),
    "exercise_detected": exercise_detected,
    "recovery_label": recovery.get("label", "Sem classificacao"),
    "sleep_hours": sleep_h,
    "steps": steps,
    "stress_score": engine_result.get("stress_score", 50),
    "recovery_score": engine_result.get("recovery_score", 50),
    "risk_score": engine_result.get("risk_score", 50),
    "contexto": engine_result.get("contexto", "unknown"),
    "alert": engine_result.get("alert"),
    "scenario": biometrics.get("scenario", "random"),
}

        safe_biometrics = {
            k: v
            for k, v in biometrics.items()
            if k not in ("_id", "hourly_bpm", "hourly_steps")
        }

        return {
            "status": "synced",
            "scenario": biometrics.get("scenario", "random"),
            "has_real_data": biometrics.get("has_real_data", False),
            "data": safe_biometrics,
            "auto_analysis": analysis_result,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing wearable data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))