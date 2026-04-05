import uuid
import io
import logging
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from database import db
from auth_utils import hash_password, get_current_colaborador
from models import (
    DashboardMetrics, ColaboradorResponse, Colaborador,
    TeamOverviewResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        total_colaboradores = await db.colaboradores.count_documents({})
        total_analises = await db.analyses.count_documents({})
        pipeline_avg = [{"$group": {"_id": None, "avg_score": {"$avg": "$v_score"}}}]
        avg_result = await db.analyses.aggregate(pipeline_avg).to_list(1)
        media_v_score = avg_result[0]["avg_score"] if avg_result else 0
        criticos = await db.analyses.count_documents({"v_score": {"$lt": 50}})
        atencao = await db.analyses.count_documents({"v_score": {"$gte": 50, "$lt": 80}})
        otimo = await db.analyses.count_documents({"v_score": {"$gte": 80}})

        return DashboardMetrics(
            total_colaboradores=total_colaboradores, total_analises=total_analises,
            media_v_score=round(media_v_score, 1),
            colaboradores_criticos=criticos, colaboradores_atencao=atencao,
            colaboradores_otimo=otimo, analises_por_setor={}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/colaboradores", response_model=List[ColaboradorResponse])
async def get_colaboradores(request: Request, setor: Optional[str] = None):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        query = {}
        if setor:
            query["setor"] = setor

        colaboradores = await db.colaboradores.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
        return [
            ColaboradorResponse(
                id=c["id"], nome=c["nome"], data_nascimento=c["data_nascimento"],
                email=c["email"], foto_url=c.get("foto_url"), setor=c["setor"],
                nivel_acesso=c["nivel_acesso"], created_at=c.get("created_at", ""),
                updated_at=c.get("updated_at", "")
            )
            for c in colaboradores
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching colaboradores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/setores")
async def get_setores(request: Request):
    """Lista os setores disponíveis para filtro."""
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado.")
        setores = await db.colaboradores.distinct("setor")
        return {"setores": sorted(setores)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching setores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/dashboard/add-employee")
async def add_employee(request: Request):
    try:
        gestor = await get_current_colaborador(request)
        if gestor["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        body = await request.json()
        nome = body.get("nome", "").strip()
        email = body.get("email", "").strip().lower()
        setor = body.get("setor", "Operacional")
        cargo = body.get("cargo", "")

        if not nome or not email:
            raise HTTPException(status_code=400, detail="Nome e email sao obrigatorios.")

        # Preparar contexto B2B do gestor
        gestor_domain = gestor.get("domain")
        domain = email.split("@")[1] if "@" in email else None
        linked_domain = gestor_domain if gestor_domain else domain
        nivel_acesso = body.get("nivel_acesso", "User")
        if nivel_acesso not in ("User", "Gestor"):
            nivel_acesso = "User"

        existing = await db.colaboradores.find_one({"email": email}, {"_id": 0})
        if existing:
            # B2B Hibrido: se o usuario ja existe como personal e RH quer vincular
            if existing.get("account_type") == "personal" and not existing.get("registered_by_rh"):
                await db.colaboradores.update_one(
                    {"id": existing["id"]},
                    {"$set": {
                        "account_type": "corporate",
                        "domain": linked_domain,
                        "setor": setor,
                        "cargo": cargo,
                        "nivel_acesso": nivel_acesso,
                        "registered_by_rh": True,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                return {
                    "id": existing["id"], "nome": existing["nome"], "email": email,
                    "setor": setor, "cargo": cargo, "account_type": "corporate",
                    "message": f"Funcionario {existing['nome']} vinculado ao modo corporativo com sucesso.",
                    "already_registered": True
                }
            raise HTTPException(status_code=400, detail="Email ja cadastrado.")

        # Se o gestor pertence a uma empresa, vincular o funcionario a mesma empresa
        account_type = "corporate" if gestor_domain else ("corporate" if domain and await db.corporate_domains.find_one({"domain": domain}, {"_id": 0}) else "personal")

        temp_password = f"Temp{uuid.uuid4().hex[:6]}!"

        new_colab = Colaborador(
            nome=nome, email=email, password_hash=hash_password(temp_password),
            data_nascimento="2000-01-01", setor=setor, nivel_acesso=nivel_acesso,
            cargo=cargo, account_type=account_type, domain=linked_domain,
            must_change_password=True, must_accept_lgpd=True, registered_by_rh=True
        )
        doc = new_colab.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.colaboradores.insert_one(doc)

        return {
            "id": new_colab.id, "nome": nome, "email": email,
            "setor": setor, "cargo": cargo, "account_type": account_type,
            "temp_password": temp_password,
            "message": f"Funcionario {nome} cadastrado com sucesso."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/team-overview")
async def get_team_overview(request: Request, period: str = "7d", setor: str = ""):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        colab_filter = {}
        if setor:
            colab_filter["setor"] = setor

        total_colabs = await db.colaboradores.count_documents(colab_filter)

        # Get filtered colaborador IDs
        colab_ids = None
        if setor:
            colabs = await db.colaboradores.find(colab_filter, {"_id": 0, "id": 1}).to_list(10000)
            colab_ids = [c["id"] for c in colabs]
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = datetime.now(timezone.utc) - timedelta(days=days)

        analysis_query = {"timestamp": {"$gte": period_start.isoformat()}}
        if colab_ids is not None:
            analysis_query["colaborador_id"] = {"$in": colab_ids}

        all_analyses = await db.analyses.find(
            analysis_query,
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1, "colaborador_id": 1}
        ).sort("timestamp", 1).to_list(5000)

        if not all_analyses:
            return TeamOverviewResponse(
                total_colaboradores=total_colabs, avg_v_score=0, avg_stress_level=0,
                distribution={"verde": 0, "amarelo": 0, "vermelho": 0},
                trend_7d=[], lei_14831_alerts=0, engagement_rate=0
            )

        all_scores = [a["v_score"] for a in all_analyses]
        avg_v_score = round(sum(all_scores) / len(all_scores), 1)
        avg_stress = round(100 - avg_v_score, 1)

        verde = sum(1 for a in all_analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in all_analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in all_analyses if a["v_score"] < 50)

        daily = {}
        for a in all_analyses:
            day = a["timestamp"][:10]
            daily.setdefault(day, []).append(a["v_score"])

        trend_7d = [{"date": d, "avg_v_score": round(sum(s)/len(s), 1), "total_analyses": len(s)} for d, s in sorted(daily.items())]

        colab_scores = {}
        for a in all_analyses:
            cid = a.get("colaborador_id", "unknown")
            colab_scores.setdefault(cid, []).append(a["v_score"])

        lei_alerts = sum(1 for scores in colab_scores.values() if sum(scores)/len(scores) < 50)
        active = len(colab_scores)
        engagement = round((active / total_colabs) * 100, 1) if total_colabs > 0 else 0

        return TeamOverviewResponse(
            total_colaboradores=total_colabs, avg_v_score=avg_v_score,
            avg_stress_level=avg_stress,
            distribution={"verde": verde, "amarelo": amarelo, "vermelho": vermelho},
            trend_7d=trend_7d, lei_14831_alerts=lei_alerts,
            engagement_rate=engagement
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/export-pdf")
async def export_dashboard_pdf(request: Request, period: str = "7d"):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        now = datetime.now(timezone.utc)
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = now - timedelta(days=days)
        period_label = {"7d": "7 dias", "30d": "30 dias", "6m": "6 meses"}.get(period, "7 dias")

        analyses = await db.analyses.find(
            {"timestamp": {"$gte": period_start.isoformat()}},
            {"_id": 0, "v_score": 1, "status_visual": 1, "timestamp": 1, "area_afetada": 1, "colaborador_id": 1}
        ).to_list(10000)

        total = len(analyses)
        all_scores = [a["v_score"] for a in analyses]
        avg_v = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
        verde = sum(1 for a in analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in analyses if a["v_score"] < 50)

        colab_scores = {}
        for a in analyses:
            cid = a.get("colaborador_id", "unknown")
            colab_scores.setdefault(cid, []).append(a["v_score"])
        burnout_risk = sum(1 for s in colab_scores.values() if sum(s)/len(s) < 50)
        total_colabs = len(colab_scores)

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
        elements.append(Paragraph("VitalFlow - Relatorio de Saude Mental", title_style))
        elements.append(Paragraph(f"Periodo: Ultimos {period_label} | Gerado em {now.strftime('%d/%m/%Y as %H:%M')} | Por: {colaborador['nome']}", subtitle_style))

        elements.append(Paragraph("Resumo Executivo", h2_style))
        elements.append(Paragraph(f"Total de analises no periodo: {total}", body_style))
        elements.append(Paragraph(f"V-Score medio da equipe: {avg_v}/100", body_style))
        elements.append(Paragraph(f"Colaboradores ativos: {total_colabs}", body_style))
        risk_pct = round((burnout_risk / total_colabs) * 100, 1) if total_colabs > 0 else 0
        elements.append(Paragraph(f"Colaboradores em risco de burnout: {burnout_risk} ({risk_pct}%)", body_style))
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
            elements.append(Spacer(1, 5*mm))

        elements.append(Paragraph("Conformidade Lei 14.831/2024 (Saude Mental no Trabalho)", h2_style))
        if burnout_risk > 0:
            elements.append(Paragraph(f"ATENCAO: {burnout_risk} colaborador(es) com V-Score medio abaixo de 50 no periodo. A legislacao exige intervencao preventiva.", body_style))
        else:
            elements.append(Paragraph("Nenhum colaborador em risco critico no periodo analisado. Empresa em conformidade.", body_style))

        elements.append(Spacer(1, 10*mm))
        elements.append(Paragraph("Dados 100% anonimizados conforme LGPD. Nenhum colaborador individual e identificado neste relatorio.", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'))))

        pdf_doc.build(elements)
        buffer.seek(0)

        return StreamingResponse(
            buffer, media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vitalflow_relatorio_{period}_{now.strftime('%Y%m%d')}.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
