import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException
from database import db
from auth_utils import get_current_colaborador
from models import PredictiveAlert, HealthTrendResponse
from services.domain_service import analyze_stress_patterns

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/predictive/alert")
async def get_predictive_alert(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        account_type = colaborador.get("account_type", "personal")
        is_premium = colaborador.get("is_premium", False)
        if account_type == "personal" and not is_premium:
            return {
                "has_alert": False, "locked": True,
                "message": "Recurso exclusivo do plano Premium. Faca upgrade para acessar predicoes de IA."
            }

        alert_data = await analyze_stress_patterns(colaborador["id"])
        if not alert_data:
            return {"has_alert": False, "message": "Nenhum padrao detectado ainda"}

        alert = PredictiveAlert(
            colaborador_id=colaborador["id"],
            predicted_stress_time=alert_data["predicted_stress_time"],
            current_time=alert_data["current_time"],
            minutes_until_stress=alert_data["minutes_until_stress"],
            confidence=alert_data["confidence"],
            ai_message=alert_data["ai_message"],
            pattern_detected=alert_data["pattern_detected"]
        )
        doc = alert.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.predictive_alerts.insert_one(doc)

        return {
            "has_alert": True,
            "alert": {
                "message": alert_data["ai_message"],
                "predicted_time": alert_data["predicted_stress_time"],
                "minutes_until": alert_data["minutes_until_stress"],
                "confidence": alert_data["confidence"],
                "pattern": alert_data["pattern_detected"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting predictive alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/trend")
async def get_health_trend(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"], "timestamp": {"$gte": seven_days_ago.isoformat()}},
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1}
        ).sort("timestamp", 1).to_list(500)

        if len(analyses) < 2:
            return HealthTrendResponse(
                trend="stable", v_scores_7d=[], avg_7d=0,
                requires_intervention=False
            )

        daily = {}
        for a in analyses:
            day = a["timestamp"][:10]
            daily.setdefault(day, []).append(a["v_score"])

        v_scores_7d = [{"date": d, "avg_v_score": round(sum(s)/len(s), 1), "count": len(s)} for d, s in sorted(daily.items())]
        all_scores = [s for scores in daily.values() for s in scores]
        avg_7d = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        if len(v_scores_7d) >= 2:
            mid = len(v_scores_7d) // 2
            first_half = sum(d["avg_v_score"] for d in v_scores_7d[:mid]) / mid
            second_half = sum(d["avg_v_score"] for d in v_scores_7d[mid:]) / (len(v_scores_7d) - mid)
            if second_half < first_half - 5:
                trend = "falling"
            elif second_half > first_half + 5:
                trend = "rising"
            else:
                trend = "stable"
        else:
            trend = "stable"

        requires_intervention = False
        intervention_message = None

        if avg_7d < 50:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - Intervencao Necessaria: V-Score medio de {avg_7d}/100 nos ultimos 7 dias indica risco a saude mental do colaborador."
        elif trend == "falling" and avg_7d < 60:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - Atencao: Tendencia de queda no V-Score (media {avg_7d}/100). Recomenda-se intervencao preventiva."

        consecutive_bad = 0
        for d in reversed(v_scores_7d):
            if d["avg_v_score"] < 50:
                consecutive_bad += 1
            else:
                break
        if consecutive_bad >= 3:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - ALERTA CRITICO: {consecutive_bad} dias consecutivos com V-Score abaixo de 50. Intervencao obrigatoria."

        return HealthTrendResponse(
            trend=trend, v_scores_7d=v_scores_7d, avg_7d=avg_7d,
            requires_intervention=requires_intervention,
            intervention_message=intervention_message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting health trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
