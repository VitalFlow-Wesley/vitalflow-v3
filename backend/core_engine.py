from datetime import datetime


def calculate_baseline(analyses):
    if not analyses:
        return {"bpm": 70, "hrv": 50}

    valid_bpm = [a.get("bpm", 70) for a in analyses if a.get("bpm") is not None]
    valid_hrv = [a.get("hrv", 50) for a in analyses if a.get("hrv") is not None]

    bpm_avg = sum(valid_bpm) / len(valid_bpm) if valid_bpm else 70
    hrv_avg = sum(valid_hrv) / len(valid_hrv) if valid_hrv else 50

    return {"bpm": bpm_avg, "hrv": hrv_avg}


def detect_context(bpm, hrv, baseline):
    baseline_bpm = baseline.get("bpm", 70)
    baseline_hrv = baseline.get("hrv", 50)

    if bpm > baseline_bpm + 20 and hrv < baseline_hrv - 10:
        return "stress"
    elif bpm > baseline_bpm + 20:
        return "exercise"
    return "normal"


def calculate_stress_score(bpm, hrv, baseline):
    baseline_bpm = baseline.get("bpm", 70)
    baseline_hrv = baseline.get("hrv", 50)

    bpm_pressure = max(0, bpm - baseline_bpm)
    hrv_pressure = max(0, baseline_hrv - hrv)

    score = (bpm_pressure * 1.6) + (hrv_pressure * 1.8)
    return max(0, min(100, round(score, 1)))


def calculate_recovery_score(hrv, baseline):
    baseline_hrv = baseline.get("hrv", 50)

    if baseline_hrv <= 0:
        return 50.0

    score = (hrv / baseline_hrv) * 100
    # Âncora absoluta: HRV < 20 nunca pode ser recovery 100
    if hrv < 20:
        score = min(score, 45.0)
    elif hrv < 30:
        score = min(score, 70.0)
    return max(0, min(100, round(score, 1)))


def calculate_v_score(stress_score, recovery_score):
    """
    Quanto maior o stress e menor a recuperação, menor o V-Score.
    """
    score = (recovery_score * 0.55) + ((100 - stress_score) * 0.45)
    return max(0, min(100, round(score, 1)))


def calculate_risk_score(stress_score, recovery_score, context, alert=None):
    """
    Risk score coerente com o estado atual:
    - stress alto aumenta risco
    - recovery baixa aumenta risco
    - contexto stress aumenta risco
    - alerta explícito aumenta risco
    """
    risk = (stress_score * 0.65) + ((100 - recovery_score) * 0.35)

    if context == "stress":
        risk += 15
    elif context == "exercise":
        risk += 5

    if alert:
        risk += 10

    return max(0, min(100, round(risk, 1)))


def generate_alert(v_score, stress_score, history_avg=None):
    if stress_score >= 75:
        return "Estresse elevado detectado"

    if v_score < 50:
        return "Queda crítica de energia"

    if history_avg is not None and v_score < (history_avg - 20):
        return "Fora do padrão normal"

    return None


def get_status_label(v_score, stress_score, recovery_score, context, alert=None):
    """
    Define o status visual usando múltiplos sinais, não só o v_score.
    """

    if (
        alert is not None
        or context == "stress"
        or stress_score >= 70
        or recovery_score < 55
        or v_score < 50
    ):
        return "critico"

    if (
        stress_score >= 40
        or recovery_score < 75
        or context == "exercise"
        or v_score < 80
    ):
        return "atencao"

    return "normal"


def process_analysis(data, baseline, history_avg=None):
    bpm = float(data["bpm"])
    hrv = float(data["hrv"])

    context = detect_context(bpm, hrv, baseline)
    stress_score = calculate_stress_score(bpm, hrv, baseline)
    recovery_score = calculate_recovery_score(hrv, baseline)
    v_score = calculate_v_score(stress_score, recovery_score)
    alert = generate_alert(v_score, stress_score, history_avg)
    risk_score = calculate_risk_score(
        stress_score, recovery_score, context, alert
    )
    status = get_status_label(
        v_score, stress_score, recovery_score, context, alert
    )

    return {
        "bpm": bpm,
        "hrv": hrv,
        "contexto": context,
        "stress_score": stress_score,
        "recovery_score": recovery_score,
        "v_score": v_score,
        "risk_score": risk_score,
        "alert": alert,
        "status_visual": status,
        "timestamp": datetime.utcnow().isoformat(),
    }