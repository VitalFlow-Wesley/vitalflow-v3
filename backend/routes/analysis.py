import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request

from auth_utils import get_current_colaborador
from core_engine import process_analysis
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()


def _to_dict(value: Any) -> Dict[str, Any]:
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "dict"):
        return value.dict()
    return dict(value)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _serialize_analysis(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": doc.get("id"),
        "timestamp": doc.get("timestamp"),
        "v_score": doc.get("v_score", 0),
        "status_visual": doc.get("status_visual", "normal"),
        "area_afetada": doc.get("area_afetada", []),
        "tag_rapida": doc.get("tag_rapida"),
        "nudge_acao": doc.get("nudge_acao"),
        "causa_provavel": doc.get("causa_provavel"),
        "engine": doc.get("engine", {}),
        "real_data": doc.get("real_data", {}),
        "activity_context": doc.get("activity_context"),
        "recovery": doc.get("recovery", {}),
        "source": doc.get("source", "unknown"),
        "data_mode": doc.get("data_mode", "real"),
        "has_real_data": doc.get("has_real_data", False),
        "bpm": doc.get("bpm"),
        "hrv": doc.get("hrv"),
        "sleep_hours": doc.get("sleep_hours"),
        "steps": doc.get("steps"),
    }


@router.post("/analyze")
async def create_analysis(input_data: Dict[str, Any], request: Request):
    try:
        colaborador = await get_current_colaborador(request)

        payload = _to_dict(input_data)
        analysis_engine_output = _to_dict(process_analysis(payload))

        timestamp = payload.get("timestamp") or analysis_engine_output.get("timestamp") or _now_iso()
        data_mode = payload.get("data_mode") or analysis_engine_output.get("data_mode") or "manual"
        has_real_data = bool(
            payload.get("has_real_data")
            or analysis_engine_output.get("has_real_data")
            or data_mode == "real"
        )

        analysis_doc = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "timestamp": timestamp,
            "created_at": _now_iso(),
            "updated_at": _now_iso(),
            "source": payload.get("source") or analysis_engine_output.get("source") or "manual",
            "data_mode": data_mode,
            "has_real_data": has_real_data,
            "real_data": payload.get("real_data", {}),
            **analysis_engine_output,
        }

        await db.analyses.insert_one(analysis_doc)
        return _serialize_analysis(analysis_doc)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(request: Request, limit: int = 30):
    try:
        colaborador = await get_current_colaborador(request)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        analyses = await db.analyses.find(
            {
                "colaborador_id": colaborador["id"],
                "data_mode": "real",
                "timestamp": {"$gte": seven_days_ago.isoformat()},
            }
        ).sort("timestamp", -1).to_list(limit)

        return [_serialize_analysis(a) for a in analyses]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str, request: Request):
    try:
        colaborador = await get_current_colaborador(request)

        analysis = await db.analyses.find_one(
            {
                "id": analysis_id,
                "colaborador_id": colaborador["id"],
                "data_mode": "real",
            }
        )

        if not analysis:
            raise HTTPException(status_code=404, detail="Análise não encontrada.")

        return _serialize_analysis(analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
