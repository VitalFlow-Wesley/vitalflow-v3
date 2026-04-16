import logging
from typing import List
from fastapi import APIRouter, Request, HTTPException

from database import db
from auth_utils import get_current_colaborador
from models import BiometricInput, Analysis, AnalysisResponse
from services.ai_service import analyze_biometrics

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze")
async def create_analysis(input_data: BiometricInput, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        input_data.colaborador_id = colaborador["id"]

        analysis_result = await analyze_biometrics(input_data)

        analysis = Analysis(
            v_score=analysis_result["v_score"],
            area_afetada=analysis_result["area_afetada"],
            status_visual=analysis_result["status_visual"],
            tag_rapida=analysis_result["tag_rapida"],
            causa_provavel=analysis_result["causa_provavel"],
            nudge_acao=analysis_result["nudge_acao"],
            input_data=input_data,
            colaborador_id=colaborador["id"],
        )

        doc = analysis.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat()
        doc["input_data"] = input_data.model_dump()

        await db.analyses.insert_one(doc)

        return {
            "id": analysis.id,
            "v_score": analysis.v_score,
            "area_afetada": analysis.area_afetada,
            "status_visual": analysis.status_visual,
            "tag_rapida": analysis.tag_rapida,
            "causa_provavel": analysis.causa_provavel,
            "nudge_acao": analysis.nudge_acao,
            "timestamp": analysis.timestamp.isoformat(),
            "colaborador_id": analysis.colaborador_id,
            "input_data": input_data.model_dump(),
            "engine": doc.get("engine"),
            "real_data": doc.get("real_data"),
            "activity_context": doc.get("activity_context"),
            "recovery": doc.get("recovery"),
            "source": doc.get("source", "manual"),
        }

    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_history(request: Request, limit: int = 30):
    try:
        colaborador = await get_current_colaborador(request)

        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0},
        ).sort("timestamp", -1).limit(limit).to_list(limit)

        response = []
        for a in analyses:
            response.append(
                {
                    "id": a.get("id"),
                    "v_score": a.get("v_score"),
                    "area_afetada": a.get("area_afetada", []),
                    "status_visual": a.get("status_visual"),
                    "tag_rapida": a.get("tag_rapida"),
                    "causa_provavel": a.get("causa_provavel"),
                    "nudge_acao": a.get("nudge_acao"),
                    "timestamp": a.get("timestamp"),
                    "colaborador_id": a.get("colaborador_id"),
                    "input_data": a.get("input_data", {}),
                    "engine": a.get("engine", {}),
                    "real_data": a.get("real_data", {}),
                    "activity_context": a.get("activity_context"),
                    "recovery": a.get("recovery", {}),
                    "source": a.get("source", "unknown"),
                }
            )

        return response

    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))