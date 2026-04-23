import os
import uuid
import json
import logging
from typing import Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import BiometricInput, MovementData

logger = logging.getLogger(__name__)


def classify_activity(bpm: int, steps: int = 0, steps_per_hour: int = 0) -> dict:
    """Classifica se BPM alto e exercicio ou estresse baseado em atividade fisica."""
    is_exercise = False
    confidence = 0.0
    label = "repouso"

    if steps_per_hour > 300 and bpm > 90:
        is_exercise = True
        confidence = min(0.95, 0.5 + (steps_per_hour / 2000))
        label = "exercicio"
    elif steps_per_hour > 500:
        is_exercise = True
        confidence = 0.8
        label = "caminhada_ativa"
    elif steps > 8000 and bpm > 85:
        is_exercise = True
        confidence = 0.6
        label = "dia_ativo"

    
    if final_v_score >= 80:
        status, tag = "Verde", "Resiliencia otima"
    elif final_v_score < 50:
        status, tag = "Vermelho", "Alerta - Recuperacao Urgente"
    
    return {
        "is_exercise": is_exercise,
        "confidence": round(confidence, 2),
        "label": label,
    }


def calculate_sleep_recovery(sleep_hours: float, sleep_quality: dict = None) -> dict:
    """Calcula fator de recuperacao baseado na qualidade do sono."""
    if sleep_hours >= 7.5:
        factor = 1.0
        label = "Recuperacao Otima"
    elif sleep_hours >= 7:
        factor = 0.95
        label = "Recuperacao Boa"
    elif sleep_hours >= 6:
        factor = 0.8
        label = "Recuperacao Moderada"
    elif sleep_hours >= 5:
        factor = 0.65
        label = "Recuperacao Insuficiente"
    else:
        factor = 0.5
        label = "Recuperacao Critica"

    # Bonus por sono profundo (se dados disponiveis)
    if sleep_quality and sleep_quality.get("deep_hours", 0) >= 1.5:
        factor = min(1.0, factor + 0.1)

    # Ajuste do limiar de estresse:
    # recovery_factor=1.0 => threshold normal (BPM 100)
    # recovery_factor=0.5 => threshold rigoroso (BPM 85)
    bpm_threshold = round(85 + (factor * 15))

    
    if final_v_score >= 80:
        status, tag = "Verde", "Resiliencia otima"
    elif final_v_score < 50:
        status, tag = "Vermelho", "Alerta - Recuperacao Urgente"
    
    return {
        "factor": round(factor, 2),
        "label": label,
        "bpm_stress_threshold": bpm_threshold,
        "hrv_stress_threshold": round(35 + (factor * 15)),
    }


async def analyze_biometrics(data: BiometricInput, activity_context: dict = None, recovery: dict = None) -> dict:
    """Analisa biometricos com contexto de atividade e recuperacao."""
    try:
        # Build enriched context
        activity_info = ""
        recovery_info = ""

        if activity_context and activity_context.get("is_exercise"):
            activity_info = f"""
CONTEXTO DE ATIVIDADE FISICA:
- Classificacao: {activity_context.get('label', 'exercicio')}
- Confianca: {activity_context.get('confidence', 0) * 100:.0f}%
- IMPORTANTE: BPM elevado durante exercicio e SAUDAVEL. Nao classifique como estresse.
"""

        if recovery:
            recovery_info = f"""
RECUPERACAO (baseada no sono):
- Fator: {recovery.get('factor', 1.0)} ({recovery.get('label', 'N/A')})
- Limiar BPM para estresse: {recovery.get('bpm_stress_threshold', 100)} bpm
  (Se sono foi ruim, BPM mais baixo ja indica estresse)
"""

        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"analysis-{uuid.uuid4()}",
            system_message="""
Voce e o motor de analise de tendencias do VitalFlow, um copiloto de longevidade e bem-estar corporativo.
Voce atua como um Coach de Performance e Bem-estar.
Sua linguagem deve ser tecnica, porem encorajadora e direta (estilo 'Biohacking').
IMPORTANTE: Voce gera INDICADORES DE BEM-ESTAR, nao diagnosticos medicos. Use termos como 'indicadores', 'tendencias', 'sugestoes de rotina'.

LOGICA DE INDICADORES (O V-SCORE):
- HRV (Variabilidade Cardiaca): Se baixa (<50ms), indique estresse do sistema nervoso
- Batimentos (BPM): Se >15% acima da media em repouso, indique alerta
  EXCECAO: Se houver atividade fisica (passos elevados), BPM alto e POSITIVO (exercicio).
- Carga Cognitiva: Se alta (>7) e sono <6h, indique fadiga cerebral
- Sono: <6h e deficit, <5h e critico. Sono ruim torna TODOS os limiares mais rigorosos.

DETECCAO DE EXERCICIO:
- Se o colaborador estava se exercitando (passos altos no periodo), BPM alto e sinal de SAUDE.
- Nao classifique exercicio como estresse. Marque como "Atividade Fisica Saudavel".
- Ajuste o V-Score para CIMA quando BPM alto e resultado de exercicio.

RECUPERACAO POR SONO:
- Se sono < 6h, o limiar de alerta de BPM deve ser mais baixo (ex: BPM 90 ja vira atencao).
- Se sono < 5h, QUALQUER BPM acima de 85 em repouso e preocupante.
- Fator de recuperacao afeta diretamente a avaliacao geral.

V-Score Calculation:
- 80-100: Verde (Otimo)
- 50-79: Amarelo (Atencao)
- 0-49: Vermelho (Alerta)

RESPONDA APENAS EM FORMATO JSON VALIDO:
{
  "v_score": <numero 0-100>,
  "area_afetada": [<lista de areas: "Cerebro", "Coracao", "Musculos", "Sistema Digestivo">],
  "status_visual": "<Verde, Amarelo ou Vermelho>",
  "tag_rapida": "<tag curta, ex: 'Overload Cognitivo' ou 'Exercicio Saudavel'>",
  "causa_provavel": "<explicacao tecnica curta>",
  "nudge_acao": "<acao de 5 minutos que o colaborador pode fazer agora>"
}
"""
        ).with_model("openai", "gpt-4o")

        prompt = f"""
ANALISE OS DADOS BIOMETRICOS DO COLABORADOR:

Perfil: {data.user_name}, {data.age} anos
- HRV (Variabilidade Cardiaca): {data.hrv} ms
- BPM Atual: {data.bpm} bpm
- BPM Media em Repouso: {data.bpm_average} bpm
- Horas de Sono: {data.sleep_hours}h
- Carga Cognitiva: {data.cognitive_load}/10
{activity_info}{recovery_info}
Faca a analise completa e retorne APENAS o JSON com os indicadores de bem-estar.
"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)

        response_text = response.strip()
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join([line for line in lines if not line.startswith('```')])

        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Error in AI analysis: {str(e)}")
        return fallback_analysis(data, activity_context, recovery)


def fallback_analysis(data: BiometricInput, activity_context: dict = None, recovery: dict = None) -> dict:
    """Analise local com deteccao de exercicio e recuperacao por sono."""
    # Get recovery-adjusted thresholds
    rec = recovery or calculate_sleep_recovery(data.sleep_hours)
    bpm_threshold = rec.get("bpm_stress_threshold", 100)
    hrv_threshold = rec.get("hrv_stress_threshold", 50)

    # Activity classification
    act = activity_context or {"is_exercise": False, "label": "repouso"}
    is_exercise = act.get("is_exercise", False)

    score = 100
    areas = []
    causes = []
    nudges = []

    # ── HRV Check ──
    if data.hrv < 30:
        score -= 30
        areas.extend(["Cerebro", "Coracao"])
        causes.append(f"HRV muito baixa ({data.hrv}ms) indica estresse do sistema nervoso")
        nudges.append("Faca 5 minutos de respiracao diafragmatica 4-7-8")
    elif data.hrv < hrv_threshold:
        score -= 15
        areas.append("Coracao")
        causes.append(f"HRV abaixo do limiar ajustado ({data.hrv}ms < {hrv_threshold}ms)")
        nudges.append("Pratique 3 minutos de respiracao box breathing")

    # ── BPM Check (com deteccao de exercicio) ──
    if is_exercise:
        # BPM alto durante exercicio e POSITIVO
        if data.bpm > 120:
            score += 5  # bonus por exercicio intenso
            causes.append(f"BPM elevado ({data.bpm}) durante {act.get('label', 'exercicio')} - Saudavel!")
        elif data.bpm > 90:
            score += 3
            causes.append(f"BPM moderado ({data.bpm}) durante atividade fisica - Normal")
        if "Musculos" not in areas:
            areas.append("Musculos")
    else:
        # BPM em repouso - usar threshold ajustado por sono
        if data.bpm > bpm_threshold + 15:
            score -= 25
            causes.append(f"BPM {data.bpm} em repouso (limiar: {bpm_threshold}) - Estresse elevado")
            nudges.append("Beba 400ml de agua gelada e descanse 10 minutos")
            if "Coracao" not in areas:
                areas.append("Coracao")
        elif data.bpm > bpm_threshold:
            score -= 15
            causes.append(f"BPM {data.bpm} acima do limiar ajustado ({bpm_threshold})")
            nudges.append("Faca uma pausa de 5 minutos do trabalho")
            if "Coracao" not in areas:
                areas.append("Coracao")

    # ── Sleep Check (com fator de recuperacao) ──
    if data.sleep_hours < 5:
        score -= 25
        causes.append(f"Sono critico ({data.sleep_hours}h) - Recuperacao muito comprometida")
        nudges.append("Tire um cochilo de 20 minutos se possivel")
        if "Cerebro" not in areas:
            areas.append("Cerebro")
    elif data.sleep_hours < 6:
        score -= 15
        causes.append(f"Deficit de sono ({data.sleep_hours}h) - Limiares de estresse mais rigorosos")
        nudges.append("Evite cafeina apos as 14h. Durma 30 min mais cedo hoje")
        if "Cerebro" not in areas:
            areas.append("Cerebro")

    # ── Cognitive Load + Sleep combo ──
    if data.cognitive_load > 7 and data.sleep_hours < 6:
        score -= 15
        causes.append(f"Carga cognitiva alta ({data.cognitive_load}/10) com sono insuficiente")
        nudges.append("Faca uma sessao de 5 min de meditacao guiada")
        if "Cerebro" not in areas:
            areas.append("Cerebro")

    score = max(0, min(100, score))

    if score >= 80:
        if is_exercise:
            status, tag = "Verde", "Exercicio Saudavel"
        else:
            status, tag = "Verde", "Resiliencia Otima"
    elif score >= 50:
        status, tag = "Amarelo", "Atencao Necessaria"
    else:
        status, tag = "Vermelho", "Alerta - Recuperacao Urgente"

    if not areas:
        areas = ["Sistema Geral"]

    
    if final_v_score >= 80:
        status, tag = "Verde", "Resiliencia otima"
    elif final_v_score < 50:
        status, tag = "Vermelho", "Alerta - Recuperacao Urgente"
    
    return {
        "v_score": score,
        "area_afetada": areas,
        "status_visual": status,
        "tag_rapida": tag,
        "causa_provavel": ". ".join(causes) if causes else "Parametros dentro da normalidade",
        "nudge_acao": nudges[0] if nudges else "Continue com bons habitos e mantenha a rotina"
    }


def generate_anonymous_id(colaborador_id: str) -> str:
    return str(uuid.uuid4())


def detect_stationary_state(movement_data: Optional[MovementData], previous_movements: list = None) -> tuple:
    if not movement_data:
        return False, 0.0
    STATIONARY_THRESHOLD = 0.1
    is_stationary = (
        abs(movement_data.accelerometer_x) < STATIONARY_THRESHOLD and
        abs(movement_data.accelerometer_y) < STATIONARY_THRESHOLD and
        abs(movement_data.accelerometer_z) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_x) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_y) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_z) < STATIONARY_THRESHOLD
    )
    simulated_duration = 75.0 if is_stationary else 0.0
    return is_stationary, simulated_duration


async def analyze_smartwatch_data(data, colaborador_id: str, steps_context: dict = None) -> dict:
    """Analise de smartwatch com deteccao de exercicio."""
    anonymous_id = generate_anonymous_id(colaborador_id)
    is_stationary, stationary_duration = detect_stationary_state(data.movement_data)

    # Exercise detection from steps context
    act = steps_context or {"is_exercise": False, "label": "repouso"}
    is_exercise = act.get("is_exercise", False)

    status = "Normal"
    risk_level = "Baixo"

    if is_exercise and data.bpm > 100:
        # BPM alto durante exercicio = Saudavel
        status = "Atividade Fisica"
        risk_level = "Baixo"
    elif data.bpm > 100 and data.hrv < 50 and is_stationary:
        status = "Alerta Critico: Estresse + Fadiga"
        risk_level = "Alto"
    elif data.bpm > 100 and data.hrv < 50:
        status = "Alerta de Estresse"
        risk_level = "Alto"
    elif is_stationary and stationary_duration > 60:
        status = "Sinal de Fadiga"
        risk_level = "Medio"

    try:
        exercise_context = ""
        if is_exercise:
            exercise_context = f"""
IMPORTANTE: O colaborador esta se exercitando ({act.get('label', 'exercicio')}).
BPM elevado durante exercicio e SAUDAVEL. Foque em dicas de performance e hidratacao.
"""

        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"smartwatch-{anonymous_id}",
            system_message="""
Voce e um coach de performance e bem-estar corporativo especializado em biohacking.
Sua funcao e fornecer recomendacoes praticas de "Reset de Foco" para colaboradores.

DIRETRIZES:
- Recomendacoes devem ser executaveis em 5-10 minutos
- Foco em tecnicas de respiracao, movimento ou mindfulness
- Linguagem direta e motivadora
- Considere o contexto de trabalho corporativo
- Priorize acoes que podem ser feitas no escritorio
- Se o colaborador esta se EXERCITANDO, diga parabens e de dicas de hidratacao/recuperacao

FORMATO DA RESPOSTA:
Titulo: [Nome da tecnica]
Acao: [Passo a passo em 2-3 frases]
Beneficio: [Resultado esperado em 1 frase]
"""
        ).with_model("openai", "gpt-4o")

        context = f"""
DADOS DO COLABORADOR (ANONIMIZADO):
- Status Detectado: {status}
- BPM: {data.bpm} (Normal: 60-100)
- HRV: {data.hrv}ms (Ideal: >50ms)
- Movimento: {"Parado ha " + str(int(stationary_duration)) + " minutos" if is_stationary else "Em movimento"}
- Nivel de Risco: {risk_level}
{exercise_context}
Forneca uma recomendacao apropriada para este cenario.
"""
        user_message = UserMessage(text=context)
        ai_response = await chat.send_message(user_message)
        recommendation = ai_response.strip()
    except Exception as e:
        logger.error(f"Error in smartwatch AI: {str(e)}")
        if is_exercise:
            recommendation = "Otimo treino! Hidrate-se com 500ml de agua e faca alongamento de 5 minutos."
        else:
            recommendation = "Faca uma pausa de 5 minutos: levante-se, caminhe e respire profundamente 5 vezes."

    
    if final_v_score >= 80:
        status, tag = "Verde", "Resiliencia otima"
    elif final_v_score < 50:
        status, tag = "Vermelho", "Alerta - Recuperacao Urgente"
    
    return {
        "anonymous_id": anonymous_id,
        "status": status,
        "bpm": data.bpm,
        "hrv": data.hrv,
        "is_stationary": is_stationary,
        "stationary_duration_minutes": stationary_duration if is_stationary else None,
        "ai_recommendation": recommendation,
        "detected_at": data.timestamp.isoformat(),
        "risk_level": risk_level,
        "push_notification_sent": False,
        "is_exercise": is_exercise,
    }
