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
            intervention_message = f"Atencao: Seus indicadores de bem-estar estao com media de {avg_7d}/100 nos ultimos 7 dias. Recomendamos que voce consulte um profissional de saude para uma avaliacao completa."
        elif trend == "falling" and avg_7d < 60:
            requires_intervention = True
            intervention_message = f"Seus indicadores de bem-estar mostram tendencia de queda (media {avg_7d}/100). Considere ajustar sua rotina e, se persistir, procure orientacao profissional."

        consecutive_bad = 0
        for d in reversed(v_scores_7d):
            if d["avg_v_score"] < 50:
                consecutive_bad += 1
            else:
                break
        if consecutive_bad >= 3:
            requires_intervention = True
            intervention_message = f"ALERTA: {consecutive_bad} dias consecutivos com indicadores de bem-estar abaixo de 50. O VitalFlow nao substitui consulta medica. Recomendamos fortemente que voce agende uma consulta com um profissional de saude para investigacao."

        # Alerta critico de consulta medica (V-Score < 40 por 3+ dias)
        consecutive_critical = 0
        for d in reversed(v_scores_7d):
            if d["avg_v_score"] < 40:
                consecutive_critical += 1
            else:
                break
        medical_alert = None
        if consecutive_critical >= 3:
            medical_alert = {
                "show": True,
                "days": consecutive_critical,
                "avg_score": round(sum(d["avg_v_score"] for d in v_scores_7d[-consecutive_critical:]) / consecutive_critical, 1),
                "message": f"Seus indicadores de bem-estar estao criticamente baixos ha {consecutive_critical} dias consecutivos (media: {round(sum(d['avg_v_score'] for d in v_scores_7d[-consecutive_critical:]) / consecutive_critical, 1)}/100). Recomendamos fortemente que voce agende uma consulta com um profissional de saude o mais breve possivel. O VitalFlow e uma ferramenta de apoio e nao substitui orientacao medica."
            }

        return HealthTrendResponse(
            trend=trend, v_scores_7d=v_scores_7d, avg_7d=avg_7d,
            requires_intervention=requires_intervention,
            intervention_message=intervention_message,
            medical_alert=medical_alert
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting health trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/personal")
async def get_personal_report(request: Request, period: str = "7d"):
    """Retorna dados do relatorio pessoal do usuario."""
    try:
        colaborador = await get_current_colaborador(request)
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = datetime.now(timezone.utc) - timedelta(days=days)

        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"], "timestamp": {"$gte": period_start.isoformat()}},
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1, "area_afetada": 1,
             "tag_rapida": 1, "nudge_acao": 1, "causa_provavel": 1}
        ).sort("timestamp", 1).to_list(5000)

        total = len(analyses)
        if total == 0:
            return {
                "total_analyses": 0, "avg_v_score": 0,
                "distribution": {"verde": 0, "amarelo": 0, "vermelho": 0},
                "trend": [], "top_areas": [], "period": period
            }

        all_scores = [a["v_score"] for a in analyses]
        avg_v = round(sum(all_scores) / len(all_scores), 1)
        verde = sum(1 for a in analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in analyses if a["v_score"] < 50)

        daily = {}
        for a in analyses:
            day = a["timestamp"][:10]
            daily.setdefault(day, []).append(a["v_score"])
        trend = [{"date": d, "avg_v_score": round(sum(s)/len(s), 1), "count": len(s)}
                 for d, s in sorted(daily.items())]

        area_count = {}
        for a in analyses:
            for area in a.get("area_afetada", []):
                area_count[area] = area_count.get(area, 0) + 1
        top_areas = sorted(area_count.items(), key=lambda x: x[1], reverse=True)[:5]

        return {
            "total_analyses": total, "avg_v_score": avg_v,
            "distribution": {"verde": verde, "amarelo": amarelo, "vermelho": vermelho},
            "trend": trend, "top_areas": [{"area": a[0], "count": a[1]} for a in top_areas],
            "period": period
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting personal report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/personal/export-pdf")
async def export_personal_pdf(request: Request, period: str = "7d"):
    """Exporta PDF do relatorio pessoal. Exclusivo para Premium/Corporate."""
    try:
        import io
        from fastapi.responses import StreamingResponse

        colaborador = await get_current_colaborador(request)

        # Verificar premium
        is_premium = colaborador.get("is_premium", False)
        account_type = colaborador.get("account_type", "personal")
        premium_expires_at = colaborador.get("premium_expires_at")

        if account_type == "personal":
            if not is_premium:
                raise HTTPException(status_code=403, detail="Recurso exclusivo do plano Premium.")
            if premium_expires_at:
                try:
                    exp = datetime.fromisoformat(premium_expires_at)
                    if datetime.now(timezone.utc) > exp:
                        raise HTTPException(status_code=403, detail="Seu trial Premium expirou. Faca upgrade para exportar PDF.")
                except (ValueError, TypeError):
                    pass

        now = datetime.now(timezone.utc)
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = now - timedelta(days=days)
        period_label = {"7d": "7 dias", "30d": "30 dias", "6m": "6 meses"}.get(period, "7 dias")

        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"], "timestamp": {"$gte": period_start.isoformat()}},
            {"_id": 0, "v_score": 1, "status_visual": 1, "timestamp": 1, "area_afetada": 1,
             "tag_rapida": 1, "nudge_acao": 1, "causa_provavel": 1}
        ).sort("timestamp", 1).to_list(5000)

        total = len(analyses)
        all_scores = [a["v_score"] for a in analyses]
        avg_v = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
        verde = sum(1 for a in analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in analyses if a["v_score"] < 50)

        area_count = {}
        for a in analyses:
            for area in a.get("area_afetada", []):
                area_count[area] = area_count.get(area, 0) + 1
        top_areas = sorted(area_count.items(), key=lambda x: x[1], reverse=True)[:4]

        from reportlab.lib.pagesizes import A4
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm

        buffer = io.BytesIO()
        pdf_doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=25*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=22, textColor=HexColor('#111111'), spaceAfter=5*mm)
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=11, textColor=HexColor('#666666'), spaceAfter=8*mm)
        h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#222222'), spaceBefore=6*mm, spaceAfter=3*mm)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, textColor=HexColor('#333333'), spaceAfter=2*mm)

        elements = []
        elements.append(Paragraph("VitalFlow - Meu Relatorio de Saude", title_style))
        elements.append(Paragraph(f"Periodo: Ultimos {period_label} | Gerado em {now.strftime('%d/%m/%Y as %H:%M')} | {colaborador['nome']}", subtitle_style))

        elements.append(Paragraph("Resumo", h2_style))
        elements.append(Paragraph(f"Total de analises no periodo: {total}", body_style))
        elements.append(Paragraph(f"V-Score medio: {avg_v}/100", body_style))
        elements.append(Spacer(1, 5*mm))

        elements.append(Paragraph("Distribuicao de Status", h2_style))
        dist_data = [
            ["Status", "Quantidade", "Percentual"],
            ["Verde (V-Score >= 80)", str(verde), f"{round(verde/total*100,1)}%" if total else "0%"],
            ["Amarelo (V-Score 50-79)", str(amarelo), f"{round(amarelo/total*100,1)}%" if total else "0%"],
            ["Vermelho (V-Score < 50)", str(vermelho), f"{round(vermelho/total*100,1)}%" if total else "0%"],
        ]
        dist_table = Table(dist_data, colWidths=[200, 100, 100])
        dist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
            ('BACKGROUND', (0, 1), (-1, 1), HexColor('#d1fae5')),
            ('BACKGROUND', (0, 2), (-1, 2), HexColor('#fef3c7')),
            ('BACKGROUND', (0, 3), (-1, 3), HexColor('#ffe4e6')),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(dist_table)
        elements.append(Spacer(1, 5*mm))

        if top_areas:
            elements.append(Paragraph("Areas Mais Afetadas", h2_style))
            area_data = [["Area", "Ocorrencias"]] + [[a[0], str(a[1])] for a in top_areas]
            area_table = Table(area_data, colWidths=[250, 100])
            area_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(area_table)

        elements.append(Spacer(1, 10*mm))
        elements.append(Paragraph("Relatorio gerado pelo VitalFlow. Dados confidenciais do usuario.", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'))))

        pdf_doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer, media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vitalflow_meu_relatorio_{period}_{now.strftime('%Y%m%d')}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting personal PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/health/morning-report")
async def get_morning_report(request: Request):
    """Morning Report: resumo da noite anterior baseado nos dados do Google Fit."""
    try:
        colaborador = await get_current_colaborador(request)
        cid = colaborador["id"]

        # Buscar ultimo sync com dados de sono
        last_sync = await db.google_fit_data.find_one(
            {"colaborador_id": cid, "sleep_hours": {"$exists": True, "$gt": 0}},
            {"_id": 0},
            sort=[("synced_at", -1)]
        )

        if not last_sync:
            return {
                "available": False,
                "message": "Nenhum dado de sono disponivel. Conecte o Google Fit para receber o Morning Report."
            }

        sleep_h = last_sync.get("sleep_hours", 0)
        sleep_quality = last_sync.get("sleep_quality", {})
        recovery = last_sync.get("recovery", {})

        deep_h = sleep_quality.get("deep_hours", 0)
        light_h = sleep_quality.get("light_hours", 0)
        rem_h = sleep_quality.get("rem_hours", 0)
        total_tracked = deep_h + light_h + rem_h

        deep_pct = round((deep_h / total_tracked * 100) if total_tracked > 0 else 0, 1)
        rem_pct = round((rem_h / total_tracked * 100) if total_tracked > 0 else 0, 1)

        # Gerar mensagem personalizada
        if sleep_h >= 7.5:
            greeting = f"Excelente noite! Voce dormiu {sleep_h}h."
            tip = "Seu corpo esta recuperado. Otimo dia para desafios cognitivos intensos."
        elif sleep_h >= 6:
            greeting = f"Noite razoavel: {sleep_h}h de sono."
            tip = "Evite reunioes muito longas no final da tarde. Faca pausas de 5 min a cada hora."
        elif sleep_h >= 5:
            greeting = f"Sono insuficiente: apenas {sleep_h}h."
            tip = "Hoje seus limiares de estresse estao mais baixos. Evite decisoes complexas apos as 15h."
        else:
            greeting = f"Noite critica: apenas {sleep_h}h de sono."
            tip = "Alerta maximo: qualquer BPM acima de 85 em repouso ja e preocupante hoje. Priorize descanso."

        from services.ai_service import calculate_sleep_recovery
        rec = calculate_sleep_recovery(sleep_h, sleep_quality)

        return {
            "available": True,
            "greeting": greeting,
            "sleep_hours": sleep_h,
            "deep_sleep_pct": deep_pct,
            "rem_sleep_pct": rem_pct,
            "recovery_factor": rec["factor"],
            "recovery_label": rec["label"],
            "bpm_stress_threshold": rec["bpm_stress_threshold"],
            "hrv_stress_threshold": rec["hrv_stress_threshold"],
            "personalized_tip": tip,
            "synced_at": last_sync.get("synced_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating morning report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
