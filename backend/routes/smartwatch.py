import uuid
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException
from database import db
from auth_utils import get_current_colaborador
from models import (
    SmartwatchData, SmartwatchAnalysisResult, EnergyStatus, TeamStressMetrics
)
from services.ai_service import analyze_smartwatch_data
from services.domain_service import send_push_notification

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status/energy", response_model=EnergyStatus)
async def get_energy_status(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        last_analysis = await db.smartwatch_analyses.find_one(
            {"colaborador_id": colaborador["id"]}, {"_id": 0}
        )

        if not last_analysis:
            return EnergyStatus(
                status="Verde", color_code="#34d399",
                label="Normal - Sem dados recentes",
                last_updated=datetime.now(timezone.utc).isoformat()
            )

        status_map = {
            "Normal": {"status": "Verde", "color_code": "#34d399", "label": "Energia Normal"},
            "Sinal de Fadiga": {"status": "Amarelo", "color_code": "#fbbf24", "label": "Atencao - Fadiga Detectada"},
            "Alerta de Estresse": {"status": "Vermelho", "color_code": "#f43f5e", "label": "Critico - Estresse Alto"},
            "Alerta Critico: Estresse + Fadiga": {"status": "Vermelho", "color_code": "#dc2626", "label": "Alerta Critico"}
        }

        current_status = last_analysis.get("status", "Normal")
        status_info = status_map.get(current_status, status_map["Normal"])

        return EnergyStatus(
            status=status_info["status"], color_code=status_info["color_code"],
            label=status_info["label"],
            last_updated=last_analysis.get("timestamp", datetime.now(timezone.utc).isoformat()),
            current_bpm=last_analysis.get("bpm"),
            current_hrv=last_analysis.get("hrv")
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting energy status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/team-stress", response_model=TeamStressMetrics)
async def get_team_stress_metrics(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        analyses = await db.smartwatch_analyses.find(
            {"timestamp": {"$gte": twenty_four_hours_ago.isoformat()}}, {"_id": 0}
        ).to_list(1000)

        if not analyses:
            return TeamStressMetrics(
                total_analyses=0, average_stress_level=0.0,
                critical_alerts=0, medium_alerts=0, normal_status=0,
                stress_distribution=[]
            )

        total_analyses = len(analyses)
        critical_count = sum(1 for a in analyses if a.get("risk_level") == "Alto")
        medium_count = sum(1 for a in analyses if a.get("risk_level") == "Medio")
        normal_count = total_analyses - critical_count - medium_count

        stress_scores = []
        for a in analyses:
            if a.get("risk_level") == "Alto":
                stress_scores.append(100)
            elif a.get("risk_level") == "Medio":
                stress_scores.append(60)
            else:
                stress_scores.append(20)

        average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0

        hour_groups = {}
        for a in analyses:
            timestamp = datetime.fromisoformat(a["timestamp"])
            hour = timestamp.hour
            if hour not in hour_groups:
                hour_groups[hour] = {"hour": f"{hour:02d}:00", "count": 0, "avg_stress": []}
            hour_groups[hour]["count"] += 1
            if a.get("risk_level") == "Alto":
                hour_groups[hour]["avg_stress"].append(100)
            elif a.get("risk_level") == "Medio":
                hour_groups[hour]["avg_stress"].append(60)
            else:
                hour_groups[hour]["avg_stress"].append(20)

        stress_distribution = []
        for hour, data in sorted(hour_groups.items()):
            avg = sum(data["avg_stress"]) / len(data["avg_stress"]) if data["avg_stress"] else 0
            stress_distribution.append({
                "hour": data["hour"], "analyses_count": data["count"],
                "avg_stress_level": round(avg, 1)
            })

        peak_stress_time = None
        if stress_distribution:
            peak = max(stress_distribution, key=lambda x: x["avg_stress_level"])
            peak_stress_time = peak["hour"]

        return TeamStressMetrics(
            total_analyses=total_analyses,
            average_stress_level=round(average_stress, 1),
            critical_alerts=critical_count, medium_alerts=medium_count,
            normal_status=normal_count, stress_distribution=stress_distribution,
            peak_stress_time=peak_stress_time
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team stress metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smartwatch/analyze", response_model=SmartwatchAnalysisResult)
async def analyze_smartwatch(data: SmartwatchData, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        result = await analyze_smartwatch_data(data, colaborador["id"])

        if "Critico" in result["status"] or result["risk_level"] == "Alto":
            notification_sent = await send_push_notification(
                colaborador, result["status"], result["ai_recommendation"]
            )
            result["push_notification_sent"] = notification_sent

        doc = {
            "id": str(uuid.uuid4()),
            "anonymous_id": result["anonymous_id"],
            "colaborador_id": colaborador["id"],
            "type": "smartwatch_analysis",
            "status": result["status"],
            "risk_level": result["risk_level"],
            "bpm": result["bpm"], "hrv": result["hrv"],
            "is_stationary": result["is_stationary"],
            "stationary_duration_minutes": result["stationary_duration_minutes"],
            "ai_recommendation": result["ai_recommendation"],
            "timestamp": result["detected_at"]
        }
        await db.smartwatch_analyses.insert_one(doc)

        return SmartwatchAnalysisResult(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in smartwatch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smartwatch/webhook")
async def smartwatch_webhook(data: SmartwatchData, device_token: str):
    try:
        logger.info(f"Smartwatch webhook received: BPM={data.bpm}, HRV={data.hrv}")
        return {
            "status": "received",
            "message": "Dados recebidos. Webhook preparado para integracao real.",
            "data_received": {"bpm": data.bpm, "hrv": data.hrv, "has_movement_data": data.movement_data is not None}
        }
    except Exception as e:
        logger.error(f"Error in smartwatch webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/smartwatch/history")
async def get_smartwatch_history(request: Request, limit: int = 20):
    try:
        colaborador = await get_current_colaborador(request)
        analyses = await db.smartwatch_analyses.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0, "colaborador_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return analyses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching smartwatch history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
