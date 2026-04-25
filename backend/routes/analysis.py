import os
import uuid
import random
import logging
from typing import Any, Dict, List, Optional
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

ALLOW_MOCK_SCENARIOS = (
    os.getenv("ALLOW_MOCK_SCENARIOS", "false").strip().lower() == "true"
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_dict(value: Any) -> Dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    try:
        return dict(value)
    except Exception:
        return {}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except Exception:
        return default


def _to_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(round(float(value)))
    except Exception:
        return default


def normalize_scenario(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    value = str(value).strip().lower()
    return value or None


def get_mock_scenario(name: Optional[str]):
    scenarios = {
        "stable": {
            "hrv": 72,
            "bpm": 64,
            "bpm_average": 66,
            "sleep_hours": 8.1,
            "steps": 9400,
            "sleep_quality": "boa",
            "has_real_data": False,
            "data_mode": "mock",
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
            "has_real_data": False,
            "data_mode": "mock",
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
            "has_real_data": False,
            "data_mode": "mock",
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
            "has_real_data": False,
            "data_mode": "mock",
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
            "has_real_data": False,
            "data_mode": "mock",
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
            "has_real_data": False,
            "data_mode": "mock",
            "activity_analysis": {
                "exercise_detected": True,
                "total_exercise_hours": 2,
                "total_stress_hours": 1,
            },
            "source": "mock_exercise_mode",
        },
    }

    if name in (None, "", "random"):
        chosen = random.choice(list(scenarios.values()))
        return dict(chosen)

    return dict(scenarios.get(name, scenarios["stable"]))


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
                    "updated_at": _now_iso(),
                }
            },
        )


async def _ensure_connected_device(
    colaborador_id: str,
    provider: str = "google_health_connect",
    device_name: str = "Google Health Connect",
):
    existing = await db.wearable_devices.find_one(
        {"colaborador_id": colaborador_id, "provider": provider},
        {"_id": 0},
    )

    now_iso = _now_iso()

    if existing:
        await db.wearable_devices.update_one(
            {"id": existing["id"]},
            {
                "$set": {
                    "device_name": existing.get("device_name") or device_name,
                    "is_connected": True,
                    "last_sync": now_iso,
                }
            },
        )
        return existing["id"]

    device_id = str(uuid.uuid4())
    await db.wearable_devices.insert_one(
        {
            "id": device_id,
            "colaborador_id": colaborador_id,
            "provider": provider,
            "device_name": device_name,
            "is_connected": True,
            "last_sync": now_iso,
            "created_at": now_iso,
        }
    )
    return device_id


async def _create_real_analysis_from_biometrics(colaborador: Dict[str, Any], biometrics: Dict[str, Any]):
    from services.ai_service import (
        analyze_biometrics,
        classify_activity,
        calculate_sleep_recovery,
    )
    from models import BiometricInput, Analysis

    cid = colaborador["id"]

    # --- INICIO DA CORRECAO DE DADOS (SpO2 ADICIONADO) ---
    bpm = _to_int(biometrics.get("bpm"))
    bpm_average = _to_int(biometrics.get("bpm_average"))
    hrv = _to_int(biometrics.get("hrv"))
    sleep_hours = _to_float(biometrics.get("sleep_hours"))
    steps = _to_int(biometrics.get("steps"))
    spo2 = _to_float(biometrics.get("spo2"))
    calories = _to_float(biometrics.get("calories"))
    distance = _to_float(biometrics.get("distance"), _to_float(biometrics.get("distance_km")))
    active_minutes = _to_int(biometrics.get("active_minutes"))

    has_minimum_signal = any(
        [
            bpm > 0,
            bpm_average > 0,
            hrv > 0,
            sleep_hours > 0,
            steps > 0,
            spo2 > 0,
            calories > 0,
            distance > 0,
            active_minutes > 0, # Considera SpO2 como sinal valido
        ]
    )

    if not has_minimum_signal:
        return None

    if bpm <= 0:
        bpm = bpm_average if bpm_average > 0 else 70

    if bpm_average <= 0:
        bpm_average = bpm

    if hrv <= 0:
        hrv = 45

    activity_analysis = biometrics.get("activity_analysis", {})
    if not isinstance(activity_analysis, dict):
        activity_analysis = {}

    exercise_detected = bool(activity_analysis.get("exercise_detected", False))
    total_exercise_hours = _to_float(activity_analysis.get("total_exercise_hours"))
    total_stress_hours = _to_float(activity_analysis.get("total_stress_hours"))
    avg_steps_per_hour = steps // 24 if steps > 0 else 0

    try:
        activity_ctx_raw = classify_activity(bpm, steps, avg_steps_per_hour)
        activity_ctx = activity_ctx_raw if isinstance(activity_ctx_raw, dict) else {"label": str(activity_ctx_raw)}
    except Exception:
        activity_ctx = {"label": "unknown"}

    try:
        recovery_raw = calculate_sleep_recovery(
            sleep_hours if sleep_hours > 0 else 7,
            biometrics.get("sleep_quality"),
        )
        recovery = recovery_raw if isinstance(recovery_raw, dict) else {"label": str(recovery_raw), "score": 0}
    except Exception:
        recovery = {"label": "unknown", "score": 0}

    history = await db.analyses.find(
        {
            "colaborador_id": cid,
            "$or": [
                {"data_mode": "real"},
                {"has_real_data": True},
                {"source": "google_fit_auto"},
                {"source": "google_fit"},
                {"source": "google_health_connect"},
            ],
        },
        {"_id": 0, "v_score": 1, "input_data": 1, "timestamp": 1},
    ).sort("timestamp", -1).to_list(20)

    history_data = []
    history_scores = []

    for item in history:
        if not isinstance(item, dict):
            continue

        previous_input = item.get("input_data", {})
        if not isinstance(previous_input, dict):
            previous_input = {}

        previous_bpm = _to_int(previous_input.get("bpm"))
        previous_hrv = _to_int(previous_input.get("hrv"))

        if previous_bpm > 0 or previous_hrv > 0:
            history_data.append(
                {
                    "bpm": previous_bpm if previous_bpm > 0 else 70,
                    "hrv": previous_hrv if previous_hrv > 0 else 45,
                }
            )

        if item.get("v_score") is not None:
            history_scores.append(item["v_score"])

    baseline = calculate_baseline(history_data)
    history_avg = sum(history_scores) / len(history_scores) if history_scores else None

    engine_result = process_analysis(
        {"bpm": bpm, "hrv": hrv},
        baseline,
        history_avg,
    )
    if not isinstance(engine_result, dict):
        engine_result = _to_dict(engine_result)

    if not engine_result:
        engine_result = {
            "v_score": 50,
            "status_visual": "Atencao",
            "stress_score": 50,
            "recovery_score": 50,
            "risk_score": 50,
            "contexto": "unknown",
            "alert": None,
        }

    input_data = BiometricInput(
        hrv=max(0, min(200, hrv)),
        bpm=max(40, min(200, bpm)),
        bpm_average=max(40, min(120, bpm_average)),
        sleep_hours=min(24, sleep_hours if sleep_hours > 0 else 0),
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

    ai_result = ai_result_raw if isinstance(ai_result_raw, dict) else _to_dict(ai_result_raw)
    if not ai_result:
        ai_result = {
            "v_score": engine_result.get("v_score", 50),
            "area_afetada": [],
            "status_visual": engine_result.get("status_visual", "Atencao"),
            "tag_rapida": "Analise automatica",
            "causa_provavel": "Processamento automatico do VitalFlow.",
            "nudge_acao": "Continue monitorando seus dados.",
        }

    final_v_score = int(
        round(
            (
                ai_result.get("v_score", engine_result.get("v_score", 50))
                + engine_result.get("v_score", 50)
            )
            / 2
        )
    )

    # --- OVERRIDE DE SEGURANCA ---
    if final_v_score >= 80:
        ai_result['status_visual'] = 'Normal'
        ai_result['tag_rapida'] = 'Resiliência ótima'
        ai_result['causa_provavel'] = 'Equilíbrio mantido. Seu estado fisiológico está estável e positivo.'
    elif final_v_score >= 50:
        ai_result['status_visual'] = 'Atencao'
        ai_result['tag_rapida'] = 'Atenção necessária'
        ai_result['causa_provavel'] = 'Alerta leve. Seu corpo indica necessidade de pequenas correções.'
    else:
        ai_result['status_visual'] = 'Critico'
        ai_result['tag_rapida'] = 'Recuperação urgente'
        ai_result['causa_provavel'] = 'Intervenção necessária. Sinais críticos detectados, priorize o descanso.'
    engine_result['status_visual'] = ai_result['status_visual']

    analysis = Analysis(
        v_score=final_v_score,
        area_afetada=ai_result.get("area_afetada", []),
        status_visual=engine_result.get("status_visual", ai_result.get("status_visual", "Atencao")),
        tag_rapida=ai_result.get("tag_rapida", "Analise automatica"),
        causa_provavel=ai_result.get("causa_provavel", "Sem causa definida"),
        nudge_acao=ai_result.get("nudge_acao", "Continue monitorando seus dados."),
        input_data=input_data,
        colaborador_id=cid,
    )

    doc = analysis.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["timestamp"] = doc["timestamp"].isoformat()
    doc["created_at"] = _now_iso()
    doc["updated_at"] = _now_iso()
    
    # --- INJETA SPO2 NO INPUT_DATA PARA O FRONTEND LER ---
    doc["input_data"] = input_data.model_dump()
    doc["input_data"]["spo2"] = spo2
    doc["input_data"]["calories"] = calories
    doc["input_data"]["distance"] = distance
    doc["input_data"]["active_minutes"] = active_minutes

    doc["source"] = biometrics.get("source", "google_fit_auto")
    doc["scenario"] = biometrics.get("scenario", "real")
    doc["data_mode"] = "real"
    doc["has_real_data"] = True
    doc["activity_context"] = activity_ctx
    doc["recovery"] = recovery
    doc["engine"] = engine_result
    doc["stress_score"] = engine_result.get("stress_score", 50)
    doc["recovery_score"] = engine_result.get("recovery_score", 50)
    doc["risk_score"] = engine_result.get("risk_score", 50)
    doc["bpm"] = bpm
    doc["hrv"] = hrv
    doc["sleep_hours"] = sleep_hours
    doc["steps"] = steps
    doc["spo2"] = spo2
    doc["calories"] = calories
    doc["distance"] = distance
    doc["active_minutes"] = active_minutes # <-- Salva no root do DB
    
    # --- SALVA SPO2 NOS DADOS REAIS ---
    doc["real_data"] = {
        "bpm": bpm,
        "bpm_average": bpm_average,
        "hrv": hrv,
        "sleep_hours": sleep_hours,
        "steps": steps,
        "spo2": spo2,
        "calories": calories,
        "distance": distance,
        "active_minutes": active_minutes,
        "calories": calories,
        "distance": distance,
        "active_minutes": active_minutes, # <-- Salva no real_data
        "sleep_quality": biometrics.get("sleep_quality"),
        "exercise_detected": exercise_detected,
        "exercise_hours": total_exercise_hours,
        "stress_periods": total_stress_hours,
    }

    await db.analyses.insert_one(doc)

    return {
        "id": doc["id"],
        "timestamp": doc["timestamp"],
        "v_score": final_v_score,
        "status_visual": doc["status_visual"],
        "tag_rapida": doc["tag_rapida"],
        "causa_provavel": doc["causa_provavel"],
        "nudge_acao": doc["nudge_acao"],
        "area_afetada": doc["area_afetada"],
        "exercise_detected": exercise_detected,
        "recovery_label": recovery.get("label", "Sem classificacao"),
        "sleep_hours": sleep_hours,
        "steps": steps,
        "spo2": spo2, # <-- Retorna pra API
        "stress_score": doc["stress_score"],
        "recovery_score": doc["recovery_score"],
        "risk_score": doc["risk_score"],
        "contexto": engine_result.get("contexto", "unknown"),
        "alert": engine_result.get("alert"),
        "scenario": doc["scenario"],
        "data_mode": "real",
        "has_real_data": True,
        "source": doc["source"],
        "input_data": doc["input_data"],
        "real_data": doc["real_data"],
        "engine": doc["engine"],
        "recovery": doc["recovery"],
        "activity_context": doc["activity_context"],
        "bpm": bpm,
        "hrv": hrv,
    }


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
            "last_sync": _now_iso(),
            "created_at": _now_iso(),
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

        await db.wearable_tokens.delete_many(
            {"colaborador_id": colaborador["id"], "provider": "google_health_connect"}
        )

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
            else "Credenciais do Google Fit nao configuradas. Adicione GOOGLE_FIT_CLIENT_ID e GOOGLE_FIT_CLIENT_SECRET no ambiente."
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
                "updated_at": _now_iso(),
            }
        },
        upsert=True,
    )

    await _ensure_connected_device(
        colaborador_id=state,
        provider="google_health_connect",
        device_name="Google Health Connect",
    )

    colab = await db.colaboradores.find_one(
        {"id": state},
        {"_id": 0},
    )

    await _activate_premium_trial_on_first_wearable(state)

    biometrics = await google_fit_service.fetch_biometrics(tokens.get("access_token"))
    if isinstance(biometrics, dict):
        biometrics["colaborador_id"] = state
        biometrics["synced_at"] = _now_iso()
        biometrics["scenario"] = "real"
        biometrics["data_mode"] = "real"
        biometrics["has_real_data"] = True
        biometrics["source"] = biometrics.get("source", "google_fit")
        await db.google_fit_data.insert_one(biometrics)

        if colab:
            try:
                await _create_real_analysis_from_biometrics(colab, biometrics)
            except Exception as sync_error:
                logger.warning(f"Google Fit callback salvou wearable, mas nao gerou analise: {sync_error}")

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(url=f"{frontend_url}/devices?google_fit=success")


@router.post("/wearables/oauth/callback")
async def wearable_oauth_callback(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        provider = body.get("provider", "google_health_connect")

        if not ALLOW_MOCK_SCENARIOS:
            raise HTTPException(
                status_code=400,
                detail="Fluxo simulado desabilitado. Use a autorizacao real do Google Fit.",
            )

        sync_data = get_mock_scenario("random")
        sync_data["source"] = provider
        sync_data["scenario"] = "random"
        sync_data["provider"] = provider

        device_id = await _ensure_connected_device(
            colaborador_id=colaborador["id"],
            provider=provider,
            device_name=provider.replace("_", " ").title(),
        )

        await _activate_premium_trial_on_first_wearable(colaborador["id"])

        return {
            "status": "authorized",
            "device_id": device_id,
            "provider": provider,
            "sync_data": sync_data,
            "message": f"Dispositivo {provider} autorizado em modo simulacao.",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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

        requested_scenario = normalize_scenario(body.get("scenario"))

        token_doc = await db.wearable_tokens.find_one(
            {"colaborador_id": cid, "provider": "google_health_connect"},
            {"_id": 0},
        )

        has_real_token = bool(token_doc and token_doc.get("access_token"))
        biometrics = None

        if requested_scenario and requested_scenario not in ("real",) and not ALLOW_MOCK_SCENARIOS:
            raise HTTPException(
                status_code=400,
                detail="Simulacao desabilitada neste ambiente.",
            )

        if has_real_token and requested_scenario in (None, "real"):
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
                                "updated_at": _now_iso(),
                            }
                        },
                    )

                    biometrics = await google_fit_service.fetch_biometrics(access_token)

            if isinstance(biometrics, dict):
                biometrics["data_mode"] = "real"
                biometrics["has_real_data"] = True
                biometrics["scenario"] = "real"
                biometrics["source"] = biometrics.get("source", "google_fit")

        if not isinstance(biometrics, dict):
            if requested_scenario and requested_scenario not in (None, "real"):
                if not ALLOW_MOCK_SCENARIOS:
                    return {
                        "status": "no_real_data",
                        "message": "Simulacao desabilitada e nenhum dado real foi sincronizado.",
                    }

                biometrics = get_mock_scenario(requested_scenario)
                biometrics["scenario"] = requested_scenario or "random"
            else:
                if has_real_token:
                    return {
                        "status": "no_data",
                        "message": "Nao foi possivel obter dados reais do Google Fit agora. Tente novamente em instantes.",
                    }

                return {
                    "status": "no_real_data",
                    "message": "Nenhum wearable real conectado. Conecte o Google Health Connect primeiro.",
                }

        biometrics["colaborador_id"] = cid
        biometrics["synced_at"] = _now_iso()
        biometrics["data_mode"] = biometrics.get("data_mode", "real")
        biometrics["has_real_data"] = biometrics.get("data_mode") == "real"
        biometrics["scenario"] = biometrics.get("scenario", "real")
        biometrics["source"] = biometrics.get("source", "google_fit")

        await db.google_fit_data.insert_one(biometrics)

        await _ensure_connected_device(
            colaborador_id=cid,
            provider="google_health_connect",
            device_name="Google Health Connect",
        )

        analysis_result = None
        try:
            analysis_result = await _create_real_analysis_from_biometrics(colaborador, biometrics)
        except Exception as analysis_error:
            logger.error(f"Erro ao gerar analise a partir do sync: {analysis_error}")

        safe_biometrics = {
            key: value
            for key, value in biometrics.items()
            if key not in ("_id", "hourly_bpm", "hourly_steps")
        }

        if analysis_result:
            return {
                "status": "synced",
                "scenario": biometrics.get("scenario", "real"),
                "has_real_data": True,
                "data_mode": "real",
                "data": safe_biometrics,
                "real_data": analysis_result.get("real_data", safe_biometrics),
                "auto_analysis": analysis_result,
            }

        return {
            "status": "synced",
            "scenario": biometrics.get("scenario", "real"),
            "has_real_data": biometrics.get("has_real_data", False),
            "data_mode": biometrics.get("data_mode", "real"),
            "data": safe_biometrics,
            "message": "Dados do wearable foram sincronizados, mas ainda sem sinais suficientes para gerar analise.",
            "auto_analysis": None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error syncing wearable data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))