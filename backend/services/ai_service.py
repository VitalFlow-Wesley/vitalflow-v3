import os
import uuid
import json
import logging
from typing import Optional
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from models import BiometricInput, MovementData

logger = logging.getLogger(__name__)


async def analyze_biometrics(data: BiometricInput) -> dict:
    try:
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
- Carga Cognitiva: Se alta (>7) e sono <6h, indique fadiga cerebral
- Sono: <6h e deficit, <5h e critico

V-Score Calculation:
- 80-100: Verde (Otimo)
- 50-79: Amarelo (Atencao)
- 0-49: Vermelho (Alerta)

RESPONDA APENAS EM FORMATO JSON VALIDO:
{
  "v_score": <numero 0-100>,
  "area_afetada": [<lista de areas: "Cerebro", "Coracao", "Musculos", "Sistema Digestivo">],
  "status_visual": "<Verde, Amarelo ou Vermelho>",
  "tag_rapida": "<tag curta, ex: 'Overload Cognitivo'>",
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
        return fallback_analysis(data)


def fallback_analysis(data: BiometricInput) -> dict:
    bpm_increase = ((data.bpm - data.bpm_average) / data.bpm_average) * 100
    score = 100
    areas = []

    if data.hrv < 30:
        score -= 30
        areas.extend(["Cerebro", "Coracao"])
    elif data.hrv < 50:
        score -= 15
        areas.append("Coracao")

    if bpm_increase > 25:
        score -= 25
        if "Coracao" not in areas:
            areas.append("Coracao")
    elif bpm_increase > 15:
        score -= 15
        if "Coracao" not in areas:
            areas.append("Coracao")

    if data.sleep_hours < 5:
        score -= 20
        if "Cerebro" not in areas:
            areas.append("Cerebro")
    elif data.sleep_hours < 6:
        score -= 10

    if data.cognitive_load > 7 and data.sleep_hours < 6:
        score -= 15
        if "Cerebro" not in areas:
            areas.append("Cerebro")

    score = max(0, min(100, score))

    if score >= 80:
        status, tag = "Verde", "Resiliencia Otima"
    elif score >= 50:
        status, tag = "Amarelo", "Atencao Necessaria"
    else:
        status, tag = "Vermelho", "Alerta Critico"

    if not areas:
        areas = ["Sistema Geral"]

    causes, nudges = [], []
    if data.hrv < 50:
        causes.append(f"HRV baixa ({data.hrv}ms) indica estresse do sistema nervoso")
        nudges.append("Faca 5 minutos de respiracao diafragmatica")
    if bpm_increase > 15:
        causes.append(f"BPM {int(bpm_increase)}% acima da media")
        nudges.append("Beba 400ml de agua gelada e descanse 10 minutos")
    if data.sleep_hours < 6:
        causes.append(f"Deficit de sono ({data.sleep_hours}h)")
        nudges.append("Tire um cochilo de 20 minutos")

    return {
        "v_score": score,
        "area_afetada": areas,
        "status_visual": status,
        "tag_rapida": tag,
        "causa_provavel": ". ".join(causes) if causes else "Parametros normais",
        "nudge_acao": nudges[0] if nudges else "Continue com bons habitos"
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


async def analyze_smartwatch_data(data, colaborador_id: str) -> dict:
    anonymous_id = generate_anonymous_id(colaborador_id)
    is_stationary, stationary_duration = detect_stationary_state(data.movement_data)

    status = "Normal"
    risk_level = "Baixo"

    if data.bpm > 100 and data.hrv < 50:
        status = "Alerta de Estresse"
        risk_level = "Alto"
    elif is_stationary and stationary_duration > 60:
        status = "Sinal de Fadiga"
        risk_level = "Medio"
    elif data.bpm > 100 and data.hrv < 50 and is_stationary:
        status = "Alerta Critico: Estresse + Fadiga"
        risk_level = "Alto"

    try:
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

Forneca uma recomendacao de Reset de Foco apropriada para este cenario.
"""
        user_message = UserMessage(text=context)
        ai_response = await chat.send_message(user_message)
        recommendation = ai_response.strip()
    except Exception as e:
        logger.error(f"Error in smartwatch AI: {str(e)}")
        recommendation = "Faca uma pausa de 5 minutos: levante-se, caminhe e respire profundamente 5 vezes."

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
        "push_notification_sent": False
    }
