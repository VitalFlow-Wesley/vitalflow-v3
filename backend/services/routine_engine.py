from typing import Dict, Any, List


def _safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_status(raw_status: str) -> str:
    value = str(raw_status or "").strip().lower()

    if any(word in value for word in ["crit", "vermelh", "alerta"]):
        return "critico"

    if any(word in value for word in ["aten", "amarel", "moderad"]):
        return "atencao"

    return "normal"


def _make_routine(
    routine_id: str,
    routine_type: str,
    title: str,
    description: str,
    duration_seconds: int,
    duration_label: str,
    focus: str,
    context: str,
    status: str,
    steps: List[Dict[str, Any]] = None,
    how_it_works: List[str] = None,
    subtype: str = None,
) -> Dict[str, Any]:
    return {
        "id": routine_id,
        "type": routine_type,
        "subtype": subtype,
        "title": title,
        "description": description,
        "duration_seconds": duration_seconds,
        "duration_label": duration_label,
        "focus": focus,
        "context": context,
        "status": status,
        "steps": steps or [],
        "how_it_works": how_it_works or [],
    }


def build_smart_routine_payload(
    current_analysis: Dict[str, Any],
    history: List[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    history = history or []

    input_data = current_analysis.get("input_data", {}) or {}
    real_data = current_analysis.get("real_data", {}) or {}

    stress = _safe_float(
        current_analysis.get("stress") or current_analysis.get("stress_score")
    )
    recovery = _safe_float(
        current_analysis.get("recovery") or current_analysis.get("recovery_score"),
        100,
    )
    v_score = _safe_float(current_analysis.get("v_score"), 100)
    bpm = _safe_float(input_data.get("bpm") or real_data.get("bpm"))
    hrv = _safe_float(input_data.get("hrv") or real_data.get("hrv"))
    sleep_hours = _safe_float(
        input_data.get("sleep_hours") or real_data.get("sleep_hours")
    )
    steps = _safe_float(input_data.get("steps") or real_data.get("steps"))

    raw_status = (
        current_analysis.get("status_visual")
        or current_analysis.get("status")
        or current_analysis.get("tag_rapida")
        or ""
    )

    status = _normalize_status(raw_status)

    # ===== ROTINAS BASE =====

    breathing_critical = _make_routine(
        routine_id="breathing_critical",
        routine_type="breathing",
        title="Recuperação prioritária",
        description="Faça uma respiração guiada para reduzir a sobrecarga fisiológica imediata.",
        duration_seconds=300,
        duration_label="5 min",
        focus="recuperação",
        context="estresse",
        status="critico",
        steps=[
            {
                "label": "Inspire",
                "seconds": 4,
                "instruction": "Inspire lentamente pelo nariz",
            },
            {
                "label": "Segure",
                "seconds": 4,
                "instruction": "Segure sem tensionar o corpo",
            },
            {
                "label": "Expire",
                "seconds": 6,
                "instruction": "Solte o ar devagar pela boca",
            },
            {
                "label": "Segure",
                "seconds": 2,
                "instruction": "Pause antes do próximo ciclo",
            },
        ],
        how_it_works=[
            "Inspire pelo nariz por 4 segundos.",
            "Segure por 4 segundos.",
            "Expire lentamente por 6 segundos.",
            "Segure por 2 segundos e repita o ciclo.",
        ],
    )

    breathing_balance = _make_routine(
        routine_id="breathing_balance",
        routine_type="breathing",
        title="Recuperação leve",
        description="Use uma respiração guiada curta para recuperar equilíbrio e reduzir tensão.",
        duration_seconds=240,
        duration_label="4 min",
        focus="equilíbrio",
        context="tensão",
        status="atencao",
        steps=[
            {
                "label": "Inspire",
                "seconds": 4,
                "instruction": "Inspire pelo nariz",
            },
            {"label": "Segure", "seconds": 4, "instruction": "Segure o ar"},
            {
                "label": "Expire",
                "seconds": 4,
                "instruction": "Expire devagar",
            },
            {
                "label": "Segure",
                "seconds": 4,
                "instruction": "Mantenha o ritmo",
            },
        ],
        how_it_works=[
            "Inspire por 4 segundos.",
            "Segure por 4 segundos.",
            "Expire por 4 segundos.",
            "Segure por 4 segundos e repita.",
        ],
    )

    breathing_maintenance = _make_routine(
        routine_id="breathing_maintenance",
        routine_type="breathing",
        title="Manutenção positiva",
        description="Mantenha seu estado estável com uma respiração curta de manutenção.",
        duration_seconds=180,
        duration_label="3 min",
        focus="manutenção",
        context="estabilidade",
        status="normal",
        steps=[
            {
                "label": "Inspire",
                "seconds": 3,
                "instruction": "Inspire suavemente",
            },
            {
                "label": "Segure",
                "seconds": 3,
                "instruction": "Segure com leveza",
            },
            {
                "label": "Expire",
                "seconds": 3,
                "instruction": "Expire sem pressa",
            },
            {
                "label": "Segure",
                "seconds": 3,
                "instruction": "Prepare o próximo ciclo",
            },
        ],
        how_it_works=[
            "Inspire por 3 segundos.",
            "Segure por 3 segundos.",
            "Expire por 3 segundos.",
            "Segure por 3 segundos e repita.",
        ],
    )

    visual_reset = _make_routine(
        routine_id="visual_reset",
        routine_type="visual",
        subtype="distance_focus",
        title="Descanso visual",
        description="Afaste o olhar da tela e foque em um ponto distante para reduzir fadiga ocular.",
        duration_seconds=20,
        duration_label="20 s",
        focus="visão",
        context="tela",
        status="atencao",
        how_it_works=[
            "Olhe para um ponto distante, cerca de 6 metros.",
            "Mantenha o foco fora da tela por 20 segundos.",
            "Piscar naturalmente ajuda a relaxar os olhos.",
        ],
    )

    walk_reset = _make_routine(
        routine_id="walk_reset",
        routine_type="movement",
        subtype="walk",
        title="Caminhada leve",
        description="Levante-se e caminhe por alguns minutos para reduzir estagnação física e clarear a mente.",
        duration_seconds=180,
        duration_label="3 min",
        focus="movimento",
        context="fadiga",
        status="atencao",
        how_it_works=[
            "Levante-se do lugar.",
            "Caminhe em ritmo leve por alguns minutos.",
            "Solte os ombros e respire naturalmente.",
        ],
    )

    hydration_boost = _make_routine(
        routine_id="hydration_boost",
        routine_type="recovery",
        subtype="hydration",
        title="Hidratação rápida",
        description="Faça uma pausa curta e beba água para apoiar recuperação, clareza mental e energia.",
        duration_seconds=60,
        duration_label="1 min",
        focus="hidratação",
        context="energia",
        status="atencao",
        how_it_works=[
            "Pegue água.",
            "Beba com calma.",
            "Respire fundo antes de voltar à atividade.",
        ],
    )

    mental_pause = _make_routine(
        routine_id="mental_pause",
        routine_type="mental",
        subtype="focus_reset",
        title="Reorganizar foco",
        description="Reduza o ruído mental e reorganize sua atenção antes de seguir.",
        duration_seconds=90,
        duration_label="1,5 min",
        focus="foco",
        context="atenção",
        status="normal",
        how_it_works=[
            "Afaste-se mentalmente da tarefa por alguns segundos.",
            "Feche os olhos ou olhe para baixo.",
            "Respire fundo uma vez.",
            "Defina apenas a próxima ação antes de continuar.",
        ],
    )

    pause_total = _make_routine(
        routine_id="pause_total",
        routine_type="mental",
        subtype="full_pause",
        title="Pausa total",
        description="Afaste-se da atividade por alguns minutos para reduzir a carga imediata e recuperar seu estado.",
        duration_seconds=300,
        duration_label="5 min",
        focus="pausa",
        context="recuperação",
        status="critico",
        how_it_works=[
            "Afaste-se da atividade atual por alguns minutos.",
            "Pare estímulos desnecessários e reduza distrações.",
            "Respire naturalmente, sem precisar seguir ciclos guiados.",
            "Retorne apenas quando sentir mais estabilidade.",
        ],
    )

    # ===== MOTOR DE DECISÃO =====

    explanation = ""
    primary = None
    alternatives = []

    has_screen_fatigue = stress >= 40 and hrv >= 40 and bpm <= 95
    has_sleep_deficit = sleep_hours > 0 and sleep_hours < 6
    has_low_movement = steps < 3000
    has_high_stress = stress >= 70 or bpm >= 100
    has_low_recovery = recovery < 60
    has_good_state = v_score >= 80 and stress < 35 and recovery >= 75

    if status == "critico":
        if has_high_stress and has_sleep_deficit:
            primary = pause_total
            alternatives = [hydration_boost, breathing_critical]
            explanation = (
                "Seu estado indica sobrecarga alta e desgaste acumulado. "
                "Uma pausa total tende a ajudar mais agora."
            )
        elif has_high_stress:
            primary = breathing_critical
            alternatives = [hydration_boost, walk_reset]
            explanation = (
                "Seu estado indica sobrecarga imediata. "
                "A prioridade é baixar a ativação fisiológica."
            )
        elif has_sleep_deficit or has_low_recovery:
            primary = walk_reset
            alternatives = [hydration_boost, breathing_critical]
            explanation = (
                "Seu corpo mostra desgaste acumulado. Movimento leve pode ajudar "
                "a reativar seu sistema sem sobrecarregar."
            )
        else:
            primary = breathing_critical
            alternatives = [hydration_boost, mental_pause]
            explanation = (
                "Seu estado exige uma intervenção curta e direta para recuperar estabilidade."
            )

    elif status == "atencao":
        if has_screen_fatigue:
            primary = visual_reset
            alternatives = [hydration_boost, breathing_balance]
            explanation = "Seu padrão parece mais próximo de fadiga de tela e atenção."
        elif has_low_movement:
            primary = walk_reset
            alternatives = [hydration_boost, breathing_balance]
            explanation = (
                "Há sinais de baixa ativação corporal. Uma caminhada leve pode ajudar agora."
            )
        elif has_sleep_deficit:
            primary = hydration_boost
            alternatives = [breathing_balance, visual_reset]
            explanation = (
                "Seu estado pede uma intervenção leve para recuperar energia e clareza."
            )
        else:
            primary = breathing_balance
            alternatives = [visual_reset, mental_pause]
            explanation = (
                "Uma rotina curta de equilíbrio pode ajudar a recuperar seu estado."
            )

    else:
        if has_good_state:
            primary = breathing_maintenance
            alternatives = [mental_pause, hydration_boost]
            explanation = (
                "Seu estado está estável. O objetivo agora é manter consistência e prevenir queda."
            )
        else:
            primary = mental_pause
            alternatives = [hydration_boost, breathing_maintenance]
            explanation = (
                "Seu estado está controlado, mas uma pausa curta pode melhorar foco e manutenção."
            )

    return {
        "status": status,
        "explanation": explanation,
        "primary": primary,
        "alternatives": alternatives,
        "signals": {
            "stress": stress,
            "recovery": recovery,
            "v_score": v_score,
            "bpm": bpm,
            "hrv": hrv,
            "sleep_hours": sleep_hours,
            "steps": steps,
        },
    }