import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Request

from auth_utils import get_current_colaborador
from core_engine import process_analysis
from database import db

logger = logging.getLogger(__name__)
router = APIRouter()


REAL_SOURCES = {
    "google_fit",
    "wearable",
    "google_health_connect",
    "health_connect",
    "google_fit_oauth",
}


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


def _pick_first_non_none(*values: Any) -> Any:
    for value in values:
        if value is not None:
            return value
    return None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_source(source: Optional[str], has_real_data: bool) -> str:
    if source:
        return str(source).strip().lower()
    return "google_fit" if has_real_data else "manual"


def _normalize_data_mode(
    payload: Dict[str, Any],
    engine_output: Dict[str, Any],
    source: str,
    real_data: Dict[str, Any],
) -> str:
    explicit = payload.get("data_mode") or engine_output.get("data_mode")
    if explicit:
        return str(explicit).strip().lower()

    if real_data or source in REAL_SOURCES:
        return "real"

    return "manual"


def _build_real_filter(
    colaborador_id: str,
    since_iso: Optional[str] = None,
    analysis_id: Optional[str] = None,
) -> Dict[str, Any]:
    query: Dict[str, Any] = {
        "colaborador_id": colaborador_id,
        "$or": [
            {"data_mode": "real"},
            {"has_real_data": True},
            {"source": {"$in": list(REAL_SOURCES)}},
        ],
    }

    if since_iso:
        query["timestamp"] = {"$gte": since_iso}

    if analysis_id:
        query["id"] = analysis_id

    return query


def _serialize_analysis(doc: Dict[str, Any]) -> Dict[str, Any]:
    engine = _to_dict(doc.get("engine"))
    recovery = _to_dict(doc.get("recovery"))
    input_data = _to_dict(doc.get("input_data"))
    real_data = _to_dict(doc.get("real_data"))

    return {
        "id": doc.get("id"),
        "timestamp": doc.get("timestamp"),
        "v_score": doc.get("v_score", 0),
        "status_visual": doc.get("status_visual", "normal"),
        "area_afetada": doc.get("area_afetada", []),
        "tag_rapida": doc.get("tag_rapida"),
        "nudge_acao": doc.get("nudge_acao"),
        "causa_provavel": doc.get("causa_provavel"),
        "engine": engine,
        "input_data": input_data,
        "real_data": real_data,
        "activity_context": doc.get("activity_context"),
        "recovery": recovery,
        "source": doc.get("source", "unknown"),
        "data_mode": doc.get("data_mode", "real"),
        "has_real_data": doc.get("has_real_data", False),
        "bpm": _pick_first_non_none(doc.get("bpm"), input_data.get("bpm"), real_data.get("bpm")),
        "hrv": _pick_first_non_none(doc.get("hrv"), input_data.get("hrv"), real_data.get("hrv")),
        "sleep_hours": _pick_first_non_none(
            doc.get("sleep_hours"),
            input_data.get("sleep_hours"),
            real_data.get("sleep_hours"),
        ),
        "steps": _pick_first_non_none(doc.get("steps"), input_data.get("steps"), real_data.get("steps")),
        "stress_score": _pick_first_non_none(doc.get("stress_score"), engine.get("stress_score")),
        "recovery_score": _pick_first_non_none(doc.get("recovery_score"), engine.get("recovery_score")),
        "risk_score": _pick_first_non_none(doc.get("risk_score"), engine.get("risk_score")),
    }


@router.post("/analyze")
async def create_analysis(input_data: Dict[str, Any], request: Request):
    try:
        colaborador = await get_current_colaborador(request)

        payload = _to_dict(input_data)
        analysis_engine_output = _to_dict(process_analysis(payload))

        incoming_real_data = _to_dict(payload.get("real_data"))
        incoming_input_data = _to_dict(payload.get("input_data"))
        engine = _to_dict(analysis_engine_output.get("engine"))
        recovery = _to_dict(analysis_engine_output.get("recovery"))

        bpm = _pick_first_non_none(
            payload.get("bpm"),
            incoming_input_data.get("bpm"),
            incoming_real_data.get("bpm"),
            analysis_engine_output.get("bpm"),
            engine.get("bpm"),
        )
        hrv = _pick_first_non_none(
            payload.get("hrv"),
            incoming_input_data.get("hrv"),
            incoming_real_data.get("hrv"),
            analysis_engine_output.get("hrv"),
            engine.get("hrv"),
        )
        sleep_hours = _pick_first_non_none(
            payload.get("sleep_hours"),
            incoming_input_data.get("sleep_hours"),
            incoming_real_data.get("sleep_hours"),
            analysis_engine_output.get("sleep_hours"),
            engine.get("sleep_hours"),
        )
        steps = _pick_first_non_none(
            payload.get("steps"),
            incoming_input_data.get("steps"),
            incoming_real_data.get("steps"),
            analysis_engine_output.get("steps"),
            engine.get("steps"),
        )

        normalized_input_data = {
            "bpm": bpm,
            "hrv": hrv,
            "sleep_hours": sleep_hours,
            "steps": steps,
        }
        normalized_input_data = {
            key: value for key, value in normalized_input_data.items() if value is not None
        }

        normalized_real_data = dict(incoming_real_data)
        for key, value in normalized_input_data.items():
            normalized_real_data.setdefault(key, value)

        provisional_has_real_data = bool(
            payload.get("has_real_data")
            or analysis_engine_output.get("has_real_data")
            or normalized_real_data
        )

        provisional_source = _normalize_source(
            payload.get("source") or analysis_engine_output.get("source"),
            provisional_has_real_data,
        )

        data_mode = _normalize_data_mode(
            payload,
            analysis_engine_output,
            provisional_source,
            normalized_real_data,
        )

        has_real_data = bool(
            provisional_has_real_data
            or data_mode == "real"
            or provisional_source in REAL_SOURCES
        )

        source = _normalize_source(provisional_source, has_real_data)
        timestamp = (
            payload.get("timestamp")
            or analysis_engine_output.get("timestamp")
            or _now_iso()
        )
        now_iso = _now_iso()

        analysis_doc = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "timestamp": timestamp,
            "created_at": now_iso,
            "updated_at": now_iso,
            "source": source,
            "data_mode": "real" if has_real_data else data_mode,
            "has_real_data": has_real_data,
            "input_data": normalized_input_data,
            "real_data": normalized_real_data,
            "engine": engine,
            "recovery": recovery,
            "activity_context": analysis_engine_output.get("activity_context"),
            "v_score": analysis_engine_output.get("v_score", payload.get("v_score", 0)),
            "status_visual": analysis_engine_output.get(
                "status_visual", payload.get("status_visual", "normal")
            ),
            "area_afetada": analysis_engine_output.get(
                "area_afetada", payload.get("area_afetada", [])
            ),
            "tag_rapida": analysis_engine_output.get(
                "tag_rapida", payload.get("tag_rapida")
            ),
            "nudge_acao": analysis_engine_output.get(
                "nudge_acao", payload.get("nudge_acao")
            ),
            "causa_provavel": analysis_engine_output.get(
                "causa_provavel", payload.get("causa_provavel")
            ),
            "stress_score": _pick_first_non_none(
                analysis_engine_output.get("stress_score"),
                engine.get("stress_score"),
            ),
            "recovery_score": _pick_first_non_none(
                analysis_engine_output.get("recovery_score"),
                engine.get("recovery_score"),
            ),
            "risk_score": _pick_first_non_none(
                analysis_engine_output.get("risk_score"),
                engine.get("risk_score"),
            ),
            "bpm": bpm,
            "hrv": hrv,
            "sleep_hours": sleep_hours,
            "steps": steps,
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
        limit = max(1, min(limit, 100))

        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        query = _build_real_filter(
            colaborador_id=colaborador["id"],
            since_iso=thirty_days_ago.isoformat(),
        )

        analyses = await db.analyses.find(query).sort("timestamp", -1).to_list(limit)
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

        query = _build_real_filter(
            colaborador_id=colaborador["id"],
            analysis_id=analysis_id,
        )

        analysis = await db.analyses.find_one(query)

        if not analysis:
            raise HTTPException(status_code=404, detail="Análise não encontrada.")

        return _serialize_analysis(analysis)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis {analysis_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
