import os
import uuid
import logging
from typing import Optional
from datetime import datetime, timezone, timedelta
from database import db
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)


async def check_corporate_domain(email: str) -> tuple:
    try:
        domain = email.split('@')[1].lower()
        corporate = await db.corporate_domains.find_one(
            {"domain": domain, "is_active": True}, {"_id": 0}
        )
        if corporate:
            return True, domain, corporate["company_name"]
        return False, domain, None
    except Exception as e:
        logger.error(f"Error checking domain: {str(e)}")
        return False, None, None


async def analyze_stress_patterns(colaborador_id: str) -> Optional[dict]:
    try:
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        analyses = await db.smartwatch_analyses.find(
            {"colaborador_id": colaborador_id, "timestamp": {"$gte": seven_days_ago.isoformat()}},
            {"_id": 0}
        ).to_list(1000)

        if len(analyses) < 5:
            return None

        hour_stress = {}
        for a in analyses:
            timestamp = datetime.fromisoformat(a["timestamp"])
            hour = timestamp.hour
            weekday = timestamp.weekday()
            key = f"{weekday}_{hour}"
            if key not in hour_stress:
                hour_stress[key] = []
            if a.get("risk_level") == "Alto":
                hour_stress[key].append(100)
            elif a.get("risk_level") == "Medio":
                hour_stress[key].append(60)
            else:
                hour_stress[key].append(20)

        patterns = []
        for key, scores in hour_stress.items():
            if len(scores) >= 2:
                avg_stress = sum(scores) / len(scores)
                if avg_stress >= 70:
                    weekday, hour = key.split('_')
                    patterns.append({
                        "weekday": int(weekday), "hour": int(hour),
                        "avg_stress": avg_stress, "occurrences": len(scores)
                    })

        if not patterns:
            return None

        patterns.sort(key=lambda x: x["avg_stress"], reverse=True)

        now = datetime.now(timezone.utc)
        current_weekday = now.weekday()
        current_hour = now.hour

        for pattern in patterns:
            if pattern["weekday"] == current_weekday:
                hours_until = pattern["hour"] - current_hour
                if 0.5 <= hours_until <= 2:
                    minutes_until = int(hours_until * 60)
                    chat = LlmChat(
                        api_key=os.environ['EMERGENT_LLM_KEY'],
                        session_id=f"predictive-{colaborador_id}",
                        system_message="""
Voce e um coach de bem-estar preventivo. Sua funcao e alertar colaboradores ANTES de picos de estresse acontecerem.
DIRETRIZES:
- Tom amigavel e encorajador
- Mensagem curta (2-3 frases)
- Incluir acao especifica para prevenir o estresse
FORMATO:
[Nome], baseado no seu historico, [padrao detectado]. [Sugestao preventiva].
"""
                    ).with_model("openai", "gpt-4o")

                    colaborador = await db.colaboradores.find_one(
                        {"id": colaborador_id}, {"_id": 0, "nome": 1}
                    )
                    nome = colaborador.get("nome", "Colaborador").split()[0] if colaborador else "Colaborador"
                    weekday_names = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]

                    context = f"""
DADOS DO PADRAO:
- Colaborador: {nome}
- Padrao detectado: Picos de estresse toda {weekday_names[pattern["weekday"]]}-feira as {pattern["hour"]}h
- Nivel medio de estresse: {pattern["avg_stress"]:.0f}/100
- Ocorrencias: {pattern["occurrences"]}x nos ultimos 7 dias
- Tempo ate o proximo pico: {minutes_until} minutos

Gere um alerta preventivo personalizado.
"""
                    user_message = UserMessage(text=context)
                    ai_response = await chat.send_message(user_message)
                    confidence = min(100, (pattern["occurrences"] / 7) * 100)

                    return {
                        "predicted_stress_time": f"{pattern['hour']:02d}:00",
                        "current_time": now.strftime("%H:%M"),
                        "minutes_until_stress": minutes_until,
                        "confidence": round(confidence, 1),
                        "ai_message": ai_response.strip(),
                        "pattern_detected": f"Pico de estresse detectado as {weekday_names[pattern['weekday']]}-feiras as {pattern['hour']}h ({pattern['occurrences']}x em 7 dias)"
                    }

        return None
    except Exception as e:
        logger.error(f"Error analyzing stress patterns: {str(e)}")
        return None


async def send_push_notification(colaborador: dict, status: str, recommendation: str) -> bool:
    try:
        notification_payload = {
            "title": f"Alerta: {status}",
            "body": recommendation[:100] + "..." if len(recommendation) > 100 else recommendation,
            "priority": "high" if "Critico" in status else "normal",
            "sound": "default",
            "badge": 1,
            "data": {
                "type": "health_alert",
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

        logger.info(f"PUSH NOTIFICATION SIMULADA para {colaborador.get('nome', 'Colaborador')}")
        logger.info(f"   Titulo: {notification_payload['title']}")
        logger.info(f"   Mensagem: {notification_payload['body']}")

        notification_doc = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "type": "push_notification",
            "status": status,
            "message": recommendation,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "delivered": True
        }
        await db.notifications.insert_one(notification_doc)
        return True
    except Exception as e:
        logger.error(f"Error sending push notification: {str(e)}")
        return False
