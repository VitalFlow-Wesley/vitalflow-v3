import io
import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from auth_utils import get_current_colaborador
from database import db
from models import HealthTrendResponse, PredictiveAlert
from services.domain_service import analyze_stress_patterns

logger = logging.getLogger(__name__)
router = APIRouter()


def _period_days(period: str) -> int:
    return {"7d": 7, "30d": 30, "6m": 180}.get(period, 7)


def _period_label(period: str) -> str:
    return {"7d": "7 dias", "30d": "30 dias", "6m": "6 meses"}.get(period, "7 dias")


def _real_analysis_filter(colaborador_id: str, period_start: datetime) -> dict:
    return {
        "colaborador_id": colaborador_id,
        "data_mode": "real",
        "timestamp": {"$gte": period_start.isoformat()},
    }


def _score_distribution(analyses: list[dict]) -> tuple[int, int, int]:
    green = sum(1 for item in analyses if item.get("v_score", 0) >= 80)
    yellow = sum(1 for item in analyses if 50 <= item.get("v_score", 0) < 80)
    red = sum(1 for item in analyses if item.get("v_score", 0) < 50)
    return green, yellow, red


def _daily_trend(analyses: list[dict]) -> list[dict]:
    daily: dict[str, list[float]] = {}
    for analysis in analyses:
        timestamp = analysis.get("timestamp")
        if not timestamp:
            continue
        daily.setdefault(timestamp[:10], []).append(analysis.get("v_score", 0))

    return [
        {
            "date": day,
            "avg_v_score": round(sum(scores) / len(scores), 1),
            "count": len(scores),
        }
        for day, scores in sorted(daily.items())
    ]


def _top_areas(analyses: list[dict], limit: int = 5) -> list[dict]:
    area_count: dict[str, int] = {}
    for analysis in analyses:
        for area in analysis.get("area_afetada", []) or []:
            area_count[area] = area_count.get(area, 0) + 1

    return [
        {"area": area, "count": count}
        for area, count in sorted(area_count.items(), key=lambda item: item[1], reverse=True)[:limit]
    ]


def _is_pdf_export_allowed(colaborador: dict) -> bool:
    account_type = str(colaborador.get("account_type", "personal")).lower()
    plan_name = str(
        colaborador.get("plan")
        or colaborador.get("plano")
        or colaborador.get("subscription_plan")
        or colaborador.get("tipo_plano")
        or ""
    ).lower()
    subscription_status = str(
        colaborador.get("subscription_status") or colaborador.get("status_assinatura") or ""
    ).lower()

    allowed_emails = {"wesley@vitalflow.ai.br", "wesley310189@gmail.com"}
    email = str(colaborador.get("email", "")).lower()

    is_premium = bool(
        colaborador.get("is_premium")
        or colaborador.get("premium")
        or "premium" in plan_name
        or subscription_status in {"active", "ativo", "trialing"}
        or account_type in {"premium", "corporate", "empresa", "business"}
        or email in allowed_emails
    )

    if not is_premium:
        return False

    premium_expires_at = colaborador.get("premium_expires_at")
    if premium_expires_at:
        try:
            expires_at = datetime.fromisoformat(str(premium_expires_at).replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                return email in allowed_emails
        except (TypeError, ValueError):
            pass

    return True


def _sleep_recovery(sleep_hours: float, sleep_quality: dict) -> dict:
    deep_hours = float(sleep_quality.get("deep_hours", 0) or 0)
    rem_hours = float(sleep_quality.get("rem_hours", 0) or 0)
    quality_bonus = min((deep_hours + rem_hours) / 3.0, 1.0)
    base = min(max(sleep_hours / 8.0, 0), 1.0)
    factor = round((base * 0.75) + (quality_bonus * 0.25), 2)

    if factor >= 0.85:
        label = "Recuperacao excelente"
        bpm_threshold = 95
        hrv_threshold = 35
    elif factor >= 0.65:
        label = "Recuperacao adequada"
        bpm_threshold = 88
        hrv_threshold = 30
    elif factor >= 0.45:
        label = "Recuperacao limitada"
        bpm_threshold = 82
        hrv_threshold = 25
    else:
        label = "Recuperacao critica"
        bpm_threshold = 76
        hrv_threshold = 20

    return {
        "factor": factor,
        "label": label,
        "bpm_stress_threshold": bpm_threshold,
        "hrv_stress_threshold": hrv_threshold,
    }


async def _load_period_analyses(colaborador_id: str, period: str) -> list[dict]:
    period_start = datetime.now(timezone.utc) - timedelta(days=_period_days(period))
    return await db.analyses.find(
        _real_analysis_filter(colaborador_id, period_start),
        {
            "_id": 0,
            "v_score": 1,
            "timestamp": 1,
            "status_visual": 1,
            "area_afetada": 1,
            "tag_rapida": 1,
            "nudge_acao": 1,
            "causa_provavel": 1,
        },
    ).sort("timestamp", 1).to_list(5000)


@router.get("/predictive/alert")
async def get_predictive_alert(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        account_type = colaborador.get("account_type", "personal")
        is_premium = colaborador.get("is_premium", False)

        if account_type == "personal" and not is_premium:
            return {
                "has_alert": False,
                "locked": True,
                "message": "Recurso exclusivo do plano Premium. Faca upgrade para acessar predicoes de IA.",
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
            pattern_detected=alert_data["pattern_detected"],
        )

        doc = alert.model_dump()
        if "created_at" in doc and hasattr(doc["created_at"], "isoformat"):
            doc["created_at"] = doc["created_at"].isoformat()
        await db.predictive_alerts.insert_one(doc)

        return {
            "has_alert": True,
            "alert": {
                "message": alert_data["ai_message"],
                "predicted_time": alert_data["predicted_stress_time"],
                "minutes_until": alert_data["minutes_until_stress"],
                "confidence": alert_data["confidence"],
                "pattern": alert_data["pattern_detected"],
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error getting predictive alert: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health/trend")
async def get_health_trend(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        analyses = await db.analyses.find(
            _real_analysis_filter(colaborador["id"], seven_days_ago),
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1},
        ).sort("timestamp", 1).to_list(500)

        if len(analyses) < 2:
            return HealthTrendResponse(
                trend="stable",
                v_scores_7d=[],
                avg_7d=0,
                requires_intervention=False,
            )

        v_scores_7d = _daily_trend(analyses)
        all_scores = [score for day in v_scores_7d for score in [day["avg_v_score"]]]
        avg_7d = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        trend = "stable"
        if len(v_scores_7d) >= 2:
            mid = len(v_scores_7d) // 2
            first_half = sum(day["avg_v_score"] for day in v_scores_7d[:mid]) / mid
            second_half = sum(day["avg_v_score"] for day in v_scores_7d[mid:]) / (len(v_scores_7d) - mid)
            if second_half < first_half - 5:
                trend = "falling"
            elif second_half > first_half + 5:
                trend = "rising"

        requires_intervention = False
        intervention_message = None
        if avg_7d < 50:
            requires_intervention = True
            intervention_message = (
                f"Atencao: seus indicadores de bem-estar estao com media de {avg_7d}/100 "
                "nos ultimos 7 dias."
            )
        elif trend == "falling" and avg_7d < 60:
            requires_intervention = True
            intervention_message = (
                f"Seus indicadores mostram tendencia de queda, com media {avg_7d}/100."
            )

        consecutive_critical = 0
        for day in reversed(v_scores_7d):
            if day["avg_v_score"] < 40:
                consecutive_critical += 1
            else:
                break

        medical_alert = None
        if consecutive_critical >= 3:
            critical_avg = round(
                sum(day["avg_v_score"] for day in v_scores_7d[-consecutive_critical:]) / consecutive_critical,
                1,
            )
            medical_alert = {
                "show": True,
                "days": consecutive_critical,
                "avg_score": critical_avg,
                "message": (
                    f"Indicadores criticamente baixos ha {consecutive_critical} dias consecutivos "
                    f"(media: {critical_avg}/100)."
                ),
            }

        return HealthTrendResponse(
            trend=trend,
            v_scores_7d=v_scores_7d,
            avg_7d=avg_7d,
            requires_intervention=requires_intervention,
            intervention_message=intervention_message,
            medical_alert=medical_alert,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error getting health trend: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/report/personal")
async def get_personal_report(request: Request, period: str = "7d"):
    try:
        colaborador = await get_current_colaborador(request)
        analyses = await _load_period_analyses(colaborador["id"], period)
        total = len(analyses)

        if total == 0:
            return {
                "total_analyses": 0,
                "avg_v_score": 0,
                "distribution": {"verde": 0, "amarelo": 0, "vermelho": 0},
                "trend": [],
                "top_areas": [],
                "period": period,
            }

        scores = [item.get("v_score", 0) for item in analyses]
        green, yellow, red = _score_distribution(analyses)

        return {
            "total_analyses": total,
            "avg_v_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "distribution": {"verde": green, "amarelo": yellow, "vermelho": red},
            "trend": _daily_trend(analyses),
            "top_areas": _top_areas(analyses),
            "period": period,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error getting personal report: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/report/personal/export-pdf")
async def export_personal_pdf(request: Request, period: str = "7d"):
    try:
        colaborador = await get_current_colaborador(request)
        if not _is_pdf_export_allowed(colaborador):
            raise HTTPException(status_code=403, detail="Recurso exclusivo do Plano Premium.")

        now = datetime.now(timezone.utc)
        analyses = await _load_period_analyses(colaborador["id"], period)
        total = len(analyses)
        scores = [item.get("v_score", 0) for item in analyses]
        avg_v = round(sum(scores) / len(scores), 1) if scores else 0
        green, yellow, red = _score_distribution(analyses)
        top_areas = _top_areas(analyses, limit=4)

        from reportlab.lib.colors import HexColor
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        buffer = io.BytesIO()
        pdf_doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=25 * mm,
            bottomMargin=20 * mm,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=22, textColor=HexColor("#111111"))
        subtitle_style = ParagraphStyle(
            "Subtitle",
            parent=styles["Normal"],
            fontSize=11,
            textColor=HexColor("#666666"),
            spaceAfter=8 * mm,
        )
        h2_style = ParagraphStyle(
            "H2",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=HexColor("#222222"),
            spaceBefore=6 * mm,
            spaceAfter=3 * mm,
        )
        body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=HexColor("#333333"))

        name = colaborador.get("nome") or colaborador.get("name") or colaborador.get("email") or "Usuario VitalFlow"
        elements = [
            Paragraph("VitalFlow - Meu Relatorio de Saude", title_style),
            Paragraph(
                f"Periodo: {_period_label(period)} | Gerado em {now.strftime('%d/%m/%Y as %H:%M')} | {name}",
                subtitle_style,
            ),
            Paragraph("Resumo", h2_style),
            Paragraph(f"Total de analises no periodo: {total}", body_style),
            Paragraph(f"V-Score medio: {avg_v}/100", body_style),
            Spacer(1, 5 * mm),
            Paragraph("Distribuicao de Status", h2_style),
        ]

        dist_data = [
            ["Status", "Quantidade", "Percentual"],
            ["Verde (V-Score >= 80)", str(green), f"{round(green / total * 100, 1)}%" if total else "0%"],
            ["Amarelo (V-Score 50-79)", str(yellow), f"{round(yellow / total * 100, 1)}%" if total else "0%"],
            ["Vermelho (V-Score < 50)", str(red), f"{round(red / total * 100, 1)}%" if total else "0%"],
        ]

        dist_table = Table(dist_data, colWidths=[200, 100, 100])
        dist_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a1a2e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dddddd")),
                    ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        elements.append(dist_table)

        if top_areas:
            elements.extend([Spacer(1, 5 * mm), Paragraph("Areas Mais Afetadas", h2_style)])
            area_table = Table([["Area", "Ocorrencias"]] + [[item["area"], str(item["count"])] for item in top_areas])
            area_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#1a1a2e")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dddddd")),
                        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                    ]
                )
            )
            elements.append(area_table)

        elements.extend(
            [
                Spacer(1, 10 * mm),
                Paragraph(
                    "Relatorio gerado pelo VitalFlow. Dados confidenciais do usuario.",
                    ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=HexColor("#999999")),
                ),
            ]
        )

        pdf_doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f"attachment; filename=vitalflow_meu_relatorio_{period}_{now.strftime('%Y%m%d')}.pdf"
                )
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error exporting personal PDF: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/health/morning-report")
async def get_morning_report(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        last_sync = await db.google_fit_data.find_one(
            {
                "colaborador_id": colaborador["id"],
                "data_mode": "real",
                "sleep_hours": {"$exists": True, "$gt": 0},
            },
            {"_id": 0},
            sort=[("synced_at", -1)],
        )

        if not last_sync:
            return {
                "available": False,
                "message": "Nenhum dado de sono disponivel. Conecte o Google Fit para receber o Morning Report.",
            }

        sleep_hours = float(last_sync.get("sleep_hours", 0) or 0)
        sleep_quality = last_sync.get("sleep_quality", {}) or {}
        deep_hours = float(sleep_quality.get("deep_hours", 0) or 0)
        light_hours = float(sleep_quality.get("light_hours", 0) or 0)
        rem_hours = float(sleep_quality.get("rem_hours", 0) or 0)
        total_tracked = deep_hours + light_hours + rem_hours

        deep_pct = round((deep_hours / total_tracked * 100) if total_tracked > 0 else 0, 1)
        rem_pct = round((rem_hours / total_tracked * 100) if total_tracked > 0 else 0, 1)

        if sleep_hours >= 7.5:
            greeting = f"Excelente noite! Voce dormiu {sleep_hours}h."
            tip = "Seu corpo esta recuperado. Otimo dia para desafios cognitivos intensos."
        elif sleep_hours >= 6:
            greeting = f"Noite razoavel: {sleep_hours}h de sono."
            tip = "Evite reunioes muito longas no final da tarde. Faca pausas de 5 min a cada hora."
        elif sleep_hours >= 5:
            greeting = f"Sono insuficiente: apenas {sleep_hours}h."
            tip = "Hoje seus limiares de estresse estao mais baixos. Evite decisoes complexas apos as 15h."
        else:
            greeting = f"Noite critica: apenas {sleep_hours}h de sono."
            tip = "Alerta maximo: priorize descanso e tarefas leves hoje."

        recovery = _sleep_recovery(sleep_hours, sleep_quality)

        return {
            "available": True,
            "greeting": greeting,
            "sleep_hours": sleep_hours,
            "deep_sleep_pct": deep_pct,
            "rem_sleep_pct": rem_pct,
            "recovery_factor": recovery["factor"],
            "recovery_label": recovery["label"],
            "bpm_stress_threshold": recovery["bpm_stress_threshold"],
            "hrv_stress_threshold": recovery["hrv_stress_threshold"],
            "personalized_tip": tip,
            "synced_at": last_sync.get("synced_at"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error generating morning report: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/history")
async def get_history(request: Request, limit: int = 30):
    try:
        colaborador = await get_current_colaborador(request)
        return await db.analyses.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0},
        ).sort("timestamp", -1).to_list(limit)
    except Exception as exc:
        logger.error(f"Error fetching history: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/scheduler/sync-all")
async def scheduler_sync_all(request: Request):
    auth = request.headers.get("X-Scheduler-Secret", "")
    expected = os.environ.get("SCHEDULER_SECRET", "")
    if expected and auth != expected:
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        from routes.wearables import _create_real_analysis_from_biometrics, _ensure_connected_device
        from services import google_fit_service

        tokens = await db.wearable_tokens.find(
            {"access_token": {"$exists": True, "$ne": None}},
            {"_id": 0, "colaborador_id": 1, "access_token": 1, "refresh_token": 1},
        ).to_list(10000)

        success = 0
        failed = 0
        for token_doc in tokens:
            try:
                colaborador_id = token_doc["colaborador_id"]
                access_token = token_doc["access_token"]
                refresh_token = token_doc.get("refresh_token")

                biometrics = await google_fit_service.fetch_biometrics(access_token)
                if not biometrics and refresh_token:
                    new_tokens = await google_fit_service.refresh_access_token(refresh_token)
                    if new_tokens and new_tokens.get("access_token"):
                        access_token = new_tokens["access_token"]
                        await db.wearable_tokens.update_one(
                            {"colaborador_id": colaborador_id, "provider": "google_health_connect"},
                            {"$set": {"access_token": access_token, "updated_at": datetime.now(timezone.utc).isoformat()}},
                        )
                        biometrics = await google_fit_service.fetch_biometrics(access_token)

                if not isinstance(biometrics, dict) or not biometrics.get("has_real_data"):
                    continue

                colaborador = await db.colaboradores.find_one({"id": colaborador_id}, {"_id": 0})
                if not colaborador:
                    continue

                biometrics["colaborador_id"] = colaborador_id
                biometrics["synced_at"] = datetime.now(timezone.utc).isoformat()
                biometrics["data_mode"] = "real"
                biometrics["has_real_data"] = True
                biometrics["scenario"] = "real"
                biometrics["source"] = "google_fit_scheduler"

                await db.google_fit_data.insert_one(biometrics)
                await _ensure_connected_device(colaborador_id, "google_health_connect", "Google Health Connect")
                await _create_real_analysis_from_biometrics(colaborador, biometrics)
                success += 1
            except Exception as exc:
                failed += 1
                logger.error(f"[SCHEDULER] Erro ao sincronizar {token_doc.get('colaborador_id')}: {exc}")

        return {"status": "ok", "success": success, "failed": failed}
    except Exception as exc:
        logger.error(f"[SCHEDULER] Erro geral: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/debug/sleep-raw")
async def debug_sleep_raw():
    import httpx

    try:
        token_doc = await db.wearable_tokens.find_one({"access_token": {"$exists": True, "$ne": None}})
        if not token_doc:
            return {"error": "nenhum token em wearable_tokens", "collections": await db.list_collection_names()}

        now = datetime.now(timezone.utc)
        day_ms = 86400000
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
                headers={"Authorization": f"Bearer {token_doc.get('access_token')}"},
                json={
                    "aggregateBy": [
                        {"dataTypeName": "com.google.sleep.segment"},
                        {"dataTypeName": "com.google.activity.segment"},
                    ],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": int(now.timestamp() * 1000) - (day_ms * 2),
                    "endTimeMillis": int(now.timestamp() * 1000),
                },
            )
        return {"status": response.status_code, "buckets": response.json().get("bucket", [])}
    except Exception as exc:
        return {"error": str(exc)}
