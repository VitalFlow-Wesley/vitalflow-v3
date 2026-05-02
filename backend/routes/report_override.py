from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from auth_utils import get_current_colaborador
from routes.health import (
    _daily_trend,
    _load_period_analyses,
    _period_days,
    _top_areas,
)

router = APIRouter()


def _distribution_from_trend(trend: list[dict]) -> dict:
    return {
        "verde": sum(1 for item in trend if item.get("avg_v_score", 0) >= 80),
        "amarelo": sum(1 for item in trend if 60 <= item.get("avg_v_score", 0) < 80),
        "vermelho": sum(1 for item in trend if item.get("avg_v_score", 0) < 60),
    }


def _confidence_score(monitored_days: int, expected_days: int) -> int:
    coverage = round((monitored_days / expected_days) * 100) if expected_days else 0
    return max(55, min(96, coverage + 10))


@router.get("/report/personal")
async def get_normalized_personal_report(request: Request, period: str = "7d"):
    try:
        colaborador = await get_current_colaborador(request)
        expected_days = _period_days(period)
        analyses = await _load_period_analyses(colaborador["id"], period)
        trend = _daily_trend(analyses)
        monitored_days = len(trend)
        daily_scores = [float(item.get("avg_v_score", 0)) for item in trend]
        avg_v_score = round(sum(daily_scores) / monitored_days) if monitored_days else 0
        coverage_percent = min(100, round((monitored_days / expected_days) * 100)) if expected_days else 0

        return {
            "period": period,
            "expected_days": expected_days,
            "total_analyses": monitored_days,
            "monitored_days": monitored_days,
            "valid_days": monitored_days,
            "coverage_percent": coverage_percent,
            "confidence_score": _confidence_score(monitored_days, expected_days),
            "avg_v_score": avg_v_score,
            "distribution": _distribution_from_trend(trend),
            "trend": trend,
            "top_areas": _top_areas(analyses, limit=5),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
