import io
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from auth_utils import get_current_colaborador
from routes.health import (
    _confidence_score,
    _daily_trend,
    _is_pdf_export_allowed,
    _load_period_analyses,
    _period_days,
    _top_areas,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _distribution_from_trend(trend: list[dict]) -> tuple[int, int, int]:
    green = sum(1 for item in trend if item.get("avg_v_score", 0) >= 80)
    yellow = sum(1 for item in trend if 60 <= item.get("avg_v_score", 0) < 80)
    red = sum(1 for item in trend if item.get("avg_v_score", 0) < 60)
    return green, yellow, red


def _format_date_br(date_value: str | None) -> str:
    if not date_value:
        return "--"
    try:
        return datetime.fromisoformat(str(date_value).replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except (TypeError, ValueError):
        return str(date_value)[:10]


def _score_status(score: float) -> str:
    if score >= 80:
        return "Estavel"
    if score >= 60:
        return "Atencao"
    return "Critico"


def _score_color(score: float) -> str:
    if score >= 80:
        return "#10b981"
    if score >= 60:
        return "#f59e0b"
    return "#f43f5e"


def _trend_delta(trend: list[dict]) -> float | None:
    if len(trend) < 2:
        return None
    return round(float(trend[-1].get("avg_v_score", 0)) - float(trend[0].get("avg_v_score", 0)), 1)


def _trend_label(delta: float | None) -> str:
    if delta is None:
        return "Monitoramento em andamento"
    if delta > 1:
        return "Tendencia de melhora"
    if delta < -1:
        return "Tendencia de queda moderada"
    return "Comportamento estavel"


@router.get("/report/personal/export-pdf")
async def export_premium_personal_pdf(request: Request, period: str = "7d"):
    try:
        colaborador = await get_current_colaborador(request)
        if not _is_pdf_export_allowed(colaborador):
            raise HTTPException(status_code=403, detail="Recurso exclusivo do Plano Premium.")

        now = datetime.now(timezone.utc)
        expected_days = _period_days(period)
        analyses = await _load_period_analyses(colaborador["id"], period)
        trend = _daily_trend(analyses)
        monitored_days = len(trend)
        daily_scores = [item["avg_v_score"] for item in trend]
        avg_v = round(sum(daily_scores) / len(daily_scores), 1) if daily_scores else 0
        green, yellow, red = _distribution_from_trend(trend)
        top_areas = _top_areas(analyses, limit=4)
        delta = _trend_delta(trend)
        confidence = _confidence_score(monitored_days, expected_days)
        coverage_percent = min(100, round((monitored_days / expected_days) * 100)) if expected_days else 0
        best_day = max(trend, key=lambda item: item["avg_v_score"], default=None)
        worst_day = min(trend, key=lambda item: item["avg_v_score"], default=None)
        start_label = _format_date_br(trend[0]["date"]) if trend else "--"
        end_label = _format_date_br(trend[-1]["date"]) if trend else "--"
        target_score = 85.1
        age_average = 72.3
        trend_text = _trend_label(delta)
        impact_text = " e ".join(item["area"] for item in top_areas[:2]) if top_areas else "sem destaque relevante"
        recovery_text = (
            "Manter rotina de recuperacao"
            if delta is not None and delta > 1
            else "Atencao recomendada nas proximas 24-48h"
            if delta is not None and delta < -1
            else "Manter constancia de recuperacao"
        )
        benchmark_text = (
            "acima da media da faixa etaria e dentro da meta pessoal"
            if avg_v >= target_score
            else "acima da media da faixa etaria, mas abaixo da meta pessoal"
            if avg_v >= age_average
            else "abaixo da media da faixa etaria e da meta pessoal"
        )

        from reportlab.graphics.shapes import Circle, Drawing, Line, Rect, String
        from reportlab.lib.colors import HexColor
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        buffer = io.BytesIO()
        pdf_doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=16 * mm,
            bottomMargin=15 * mm,
            leftMargin=15 * mm,
            rightMargin=15 * mm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "VitalTitle", parent=styles["Title"], fontSize=26, leading=30,
            textColor=HexColor("#ffffff"), alignment=0, spaceAfter=0,
        )
        subtitle_style = ParagraphStyle(
            "VitalSubtitle", parent=styles["Normal"], fontSize=10, leading=14,
            textColor=HexColor("#d8f7ff"), spaceAfter=0,
        )
        body_style = ParagraphStyle(
            "VitalBody", parent=styles["Normal"], fontSize=9.5, leading=13,
            textColor=HexColor("#243042"),
        )
        table_header_style = ParagraphStyle(
            "VitalTableHeader", parent=styles["Normal"], fontSize=8, leading=10,
            textColor=HexColor("#ffffff"), alignment=1,
        )
        table_cell_style = ParagraphStyle(
            "VitalTableCell", parent=styles["Normal"], fontSize=8.5, leading=11.5,
            textColor=HexColor("#243042"),
        )
        small_style = ParagraphStyle(
            "VitalSmall", parent=styles["Normal"], fontSize=8.2, leading=11,
            textColor=HexColor("#64748b"),
        )
        card_title_style = ParagraphStyle(
            "VitalCardTitle", parent=styles["Normal"], fontSize=7.5, leading=9,
            textColor=HexColor("#64748b"), uppercase=True,
        )
        card_value_style = ParagraphStyle(
            "VitalCardValue", parent=styles["Normal"], fontSize=17, leading=20,
            textColor=HexColor("#06141b"),
        )

        def p(text: str, style=body_style) -> Paragraph:
            return Paragraph(str(text), style)

        def section_title(text: str):
            section = Table([[p(text.upper(), table_header_style)]], colWidths=[168 * mm], hAlign="LEFT")
            section.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#071014")),
                ("BOX", (0, 0), (-1, -1), 0.4, HexColor("#22d3ee")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            return section

        def table(data, widths=None, header=True, row_colors=None):
            wrapped = []
            for row_index, row in enumerate(data):
                style = table_header_style if header and row_index == 0 else table_cell_style
                wrapped.append([p(cell, style) for cell in row])

            tbl = Table(wrapped, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
            commands = [
                ("BOX", (0, 0), (-1, -1), 0.6, HexColor("#d8e1ea")),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, HexColor("#e5edf4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [HexColor("#ffffff"), HexColor("#f8fafc")]),
            ]
            if header:
                commands.extend([
                    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#071014")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#ffffff")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ])
            for row_index, color in (row_colors or {}).items():
                commands.append(("BACKGROUND", (0, row_index), (-1, row_index), HexColor(color)))
            tbl.setStyle(TableStyle(commands))
            return tbl

        def card(title: str, value: str, helper: str, value_color: str = "#06141b"):
            value_style = ParagraphStyle(
                f"VitalCardValue{title.replace(' ', '')}", parent=card_value_style,
                textColor=HexColor(value_color),
            )
            return [p(title.upper(), card_title_style), p(value, value_style), p(helper, small_style)]

        def trend_drawing(points: list[dict]):
            width = 168 * mm
            height = 42 * mm
            left = 12 * mm
            right = 8 * mm
            top = 7 * mm
            bottom = 10 * mm
            chart_width = width - left - right
            chart_height = height - top - bottom
            drawing = Drawing(width, height)
            drawing.add(Rect(0, 0, width, height, fillColor=HexColor("#f8fafc"), strokeColor=HexColor("#d8e1ea"), strokeWidth=0.6))
            for ratio in (0, 0.5, 1):
                y = bottom + chart_height * ratio
                drawing.add(Line(left, y, width - right, y, strokeColor=HexColor("#e5edf4"), strokeWidth=0.5))
            if not points:
                drawing.add(String(left, height / 2, "Sem dados para o grafico", fontSize=9, fillColor=HexColor("#64748b")))
                return drawing

            def xy(index: int, score: float):
                x = left + (chart_width * index / max(len(points) - 1, 1))
                y = bottom + (chart_height * max(0, min(score, 100)) / 100)
                return x, y

            coords = [xy(index, float(point.get("avg_v_score", 0))) for index, point in enumerate(points)]
            for start, end in zip(coords, coords[1:]):
                drawing.add(Line(start[0], start[1], end[0], end[1], strokeColor=HexColor("#22d3ee"), strokeWidth=2.2))
            for index, point in enumerate(points):
                score = float(point.get("avg_v_score", 0))
                x, y = coords[index]
                color = HexColor(_score_color(score))
                drawing.add(Circle(x, y, 3.2, fillColor=color, strokeColor=HexColor("#071014"), strokeWidth=0.8))
                drawing.add(String(x - 5, min(height - 8, y + 7), str(round(score, 1)).rstrip("0").rstrip("."), fontSize=6.5, fillColor=color))
                drawing.add(String(x - 8, 3.5, _format_date_br(point.get("date"))[:5], fontSize=6.5, fillColor=HexColor("#64748b")))
            drawing.add(String(3 * mm, height - 9, "100", fontSize=6.5, fillColor=HexColor("#94a3b8")))
            drawing.add(String(4 * mm, bottom - 1, "0", fontSize=6.5, fillColor=HexColor("#94a3b8")))
            return drawing

        name = colaborador.get("nome") or colaborador.get("name") or colaborador.get("email") or "Usuario VitalFlow"
        header = Table([[[p("VitalFlow", title_style), p("Relatorio Executivo de Resiliencia", subtitle_style), p(
            f"{name} | Periodo analisado: {start_label} a {end_label} ({monitored_days} de {expected_days} dias) | Gerado em {now.strftime('%d/%m/%Y as %H:%M')}", subtitle_style,
        )]]], colWidths=[168 * mm], hAlign="LEFT")
        header.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), HexColor("#071014")),
            ("BOX", (0, 0), (-1, -1), 0.8, HexColor("#22d3ee")),
            ("TOPPADDING", (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ]))

        elements = [
            header,
            Spacer(1, 5 * mm),
            section_title("Resumo executivo"),
            Spacer(1, 2 * mm),
            p(
                f"Sua resiliencia apresentou {_trend_label(delta).lower()}, com V-Score medio de {avg_v}/100, "
                f"cobertura de {coverage_percent}% e maior impacto fisiologico em {impact_text}.",
                body_style,
            ),
            Spacer(1, 4 * mm),
        ]

        kpi_table = Table([
            [
                card("Confiabilidade", f"{confidence}%", "qualidade dos dados"),
                card("V-Score medio", f"{avg_v}", _score_status(avg_v), _score_color(avg_v)),
                card("Cobertura", f"{coverage_percent}%", f"{monitored_days} de {expected_days} dias validos"),
            ],
            [
                card("Dias monitorados", str(monitored_days), "base da tendencia"),
                card("Melhor dia", _format_date_br(best_day["date"]) if best_day else "--", f"V-Score {best_day['avg_v_score']}" if best_day else "sem dados", "#10b981"),
                card("Pior dia", _format_date_br(worst_day["date"]) if worst_day else "--", f"V-Score {worst_day['avg_v_score']}" if worst_day else "sem dados", "#f43f5e"),
            ],
        ], colWidths=[56 * mm, 56 * mm, 56 * mm], rowHeights=[31 * mm, 31 * mm], hAlign="LEFT")
        kpi_table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, HexColor("#d8e1ea")),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, HexColor("#d8e1ea")),
            ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f8fafc")),
            ("BACKGROUND", (0, 0), (0, 0), HexColor("#e9fff7")),
            ("BACKGROUND", (1, 0), (1, 0), HexColor("#e8fbff")),
            ("BACKGROUND", (2, 0), (2, 0), HexColor("#fff7dd")),
            ("BACKGROUND", (1, 1), (1, 1), HexColor("#e9fff7")),
            ("BACKGROUND", (2, 1), (2, 1), HexColor("#ffeef2")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        elements.extend([kpi_table, Spacer(1, 4 * mm)])

        elements.extend([
            section_title("Interpretacao do periodo"), Spacer(1, 2 * mm),
            table([
                ["Leitura", "Resultado", "O que significa"],
                ["Tendencia", trend_text, "Comparacao entre inicio e fechamento do periodo"],
                ["Principal risco", impact_text, "Sistema fisiologico com maior recorrencia no periodo"],
                ["Recuperacao", recovery_text, "Orientacao para as proximas 24-48h"],
                ["Benchmark", benchmark_text, "Comparativo com faixa etaria e meta pessoal"],
            ], widths=[38 * mm, 48 * mm, 82 * mm]),
            Spacer(1, 3 * mm), section_title("Evolucao do V-Score"), Spacer(1, 2 * mm), trend_drawing(trend), Spacer(1, 2 * mm),
        ])

        if trend:
            trend_rows = [["Data", "V-Score", "Status", "Leituras"]]
            for item in trend:
                trend_rows.append([_format_date_br(item["date"]), str(item["avg_v_score"]), _score_status(item["avg_v_score"]), str(item.get("count", 1))])
            trend_row_colors = {idx: "#ecfdf5" if row[2] == "Estavel" else "#fffbeb" if row[2] == "Atencao" else "#fff1f2" for idx, row in enumerate(trend_rows) if idx > 0}
            elements.append(table(trend_rows, widths=[42 * mm, 35 * mm, 45 * mm, 35 * mm], row_colors=trend_row_colors))
        else:
            elements.append(p("Ainda nao ha leituras validas para montar a evolucao do periodo.", body_style))

        elements.extend([Spacer(1, 3 * mm), section_title("Distribuicao do periodo"), Spacer(1, 2 * mm)])
        dist_data = [
            ["Status", "Dias", "Percentual", "Criterio"],
            ["Estavel", str(green), f"{round(green / monitored_days * 100, 1)}%" if monitored_days else "0%", "V-Score >= 80"],
            ["Atencao", str(yellow), f"{round(yellow / monitored_days * 100, 1)}%" if monitored_days else "0%", "V-Score 60-79"],
            ["Critico", str(red), f"{round(red / monitored_days * 100, 1)}%" if monitored_days else "0%", "V-Score < 60"],
        ]
        elements.append(table(dist_data, widths=[42 * mm, 28 * mm, 38 * mm, 60 * mm], row_colors={1: "#ecfdf5", 2: "#fffbeb", 3: "#fff1f2"}))

        if top_areas:
            max_area = max(item["count"] for item in top_areas) or 1
            elements.extend([Spacer(1, 3 * mm), section_title("Sistemas mais impactados"), Spacer(1, 2 * mm)])
            area_rows = [["Area", "Ocorrencias", "Impacto relativo"]]
            for item in top_areas:
                area_rows.append([item["area"], str(item["count"]), f"{round(item['count'] / max_area * 100)}%"])
            elements.append(table(area_rows, widths=[70 * mm, 38 * mm, 60 * mm]))

        action_rows = [
            ["Area", "Recomendacao", "Prioridade"],
            ["Sono", "Manter horario regular e priorizar uma janela de sono completa.", "Alta"],
            ["Carga", "Reduzir intensidade de treino ou trabalho cognitivo se houver nova queda no V-Score.", "Media"],
            ["Recuperacao", "Inserir pausa ativa, hidratacao e respiracao guiada nas proximas 24-48h.", "Media"],
        ]
        if "cardio" in impact_text.lower():
            action_rows.append(["Cardiovascular", "Evitar picos de esforco e acompanhar frequencia cardiaca de repouso.", "Alta"])
        if "cogn" in impact_text.lower():
            action_rows.append(["Cognitivo", "Blocos de foco menores e intervalos reais entre tarefas exigentes.", "Media"])

        elements.extend([
            Spacer(1, 3 * mm), section_title("Comparativo de performance"), Spacer(1, 2 * mm),
            table([
                ["Referencia", "Valor", "Leitura"],
                ["Sua media", str(avg_v), _score_status(avg_v)],
                ["Faixa etaria", str(age_average), "Benchmark"],
                ["Sua meta", str(target_score), "Objetivo pessoal"],
            ], widths=[58 * mm, 35 * mm, 75 * mm]),
            Spacer(1, 3 * mm), section_title("Plano de acao 24-48h"), Spacer(1, 2 * mm),
            table(action_rows, widths=[38 * mm, 95 * mm, 35 * mm], row_colors={idx: "#fff7dd" if row[-1] == "Media" else "#ffeef2" for idx, row in enumerate(action_rows) if idx > 0}),
            Spacer(1, 3 * mm), section_title("Conclusao executiva"), Spacer(1, 2 * mm),
            p(
                f"O periodo apresentou {trend_text.lower()}, com cobertura de {monitored_days}/{expected_days} dias. "
                f"A principal oportunidade esta em preservar sono regular, reduzir esforco acumulado e acompanhar os sinais ligados a {impact_text} antes que oscilem de forma persistente.",
                body_style,
            ),
            Spacer(1, 3 * mm), section_title("Proximo periodo"), Spacer(1, 2 * mm),
            p("Continue monitorando diariamente para aumentar a confiabilidade da analise e tornar a comparacao entre periodos mais precisa.", body_style),
            Spacer(1, 6 * mm), HRFlowable(width="100%", thickness=0.6, color=HexColor("#d8e1ea"), spaceAfter=2 * mm),
            p("Relatorio gerado pelo VitalFlow com base em dados biometricos coletados pelos dispositivos conectados. Dados confidenciais do usuario.", small_style),
        ])

        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(HexColor("#94a3b8"))
            canvas.drawRightString(195 * mm, 9 * mm, f"Pagina {doc.page}")
            canvas.restoreState()

        pdf_doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vitalflow_meu_relatorio_{period}_{now.strftime('%Y%m%d')}.pdf"},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error exporting premium personal PDF: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
