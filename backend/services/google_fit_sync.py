"""
backend/services/google_fit_sync.py

Sincronização silenciosa do Google Fit usando refresh_token salvo.
Executar periodicamente via cron ou task queue (ex: APScheduler, Celery).

Dependências:
  pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client requests

Variáveis de ambiente necessárias (.env):
  GOOGLE_CLIENT_ID=...
  GOOGLE_CLIENT_SECRET=...
"""

import os
import json
import logging
from datetime import datetime, timedelta
import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Scopes necessários — devem ser os mesmos usados no OAuth inicial
SCOPES = [
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]


def get_credentials_from_db(user_id: int, db) -> dict | None:
    """
    Busca o refresh_token salvo no banco para o usuário.
    Adapte para o seu ORM/DB.
    """
    row = db.execute(
        "SELECT access_token, refresh_token, token_expiry FROM user_tokens WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    return dict(row) if row else None


def save_new_access_token(user_id: int, credentials: Credentials, db):
    """
    Salva o novo access_token após refresh (token muda a cada uso).
    """
    db.execute(
        """
        UPDATE user_tokens
        SET access_token = ?, token_expiry = ?
        WHERE user_id = ?
        """,
        (credentials.token, credentials.expiry.isoformat(), user_id)
    )
    db.commit()


def build_credentials(token_row: dict) -> Credentials:
    """Reconstrói o objeto Credentials a partir do banco."""
    return Credentials(
        token=token_row["access_token"],
        refresh_token=token_row["refresh_token"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )


def fetch_heart_rate(service, days: int = 1) -> list[dict]:
    """Busca dados de frequência cardíaca dos últimos N dias."""
    end_ms = int(datetime.utcnow().timestamp() * 1000)
    start_ms = int((datetime.utcnow() - timedelta(days=days)).timestamp() * 1000)

    data_source = "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm"

    body = {
        "aggregateBy": [{"dataTypeName": "com.google.heart_rate.bpm"}],
        "bucketByTime": {"durationMillis": 3600000},  # buckets de 1 hora
        "startTimeMillis": start_ms,
        "endTimeMillis": end_ms,
    }

    response = service.users().dataset().aggregate(userId="me", body=body).execute()
    results = []

    for bucket in response.get("bucket", []):
        for dataset in bucket.get("dataset", []):
            for point in dataset.get("point", []):
                values = point.get("value", [])
                if values:
                    results.append({
                        "timestamp": int(point["startTimeNanos"]) // 1_000_000,
                        "bpm": values[0].get("fpVal"),
                    })

    return results


def fetch_sleep(service, days: int = 7) -> list[dict]:
    """Busca sessões de sono dos últimos N dias."""
    end = datetime.utcnow()
    start = end - timedelta(days=days)

    response = service.users().sessions().list(
        userId="me",
        startTime=start.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        endTime=end.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        activityType=72,  # 72 = sleep
    ).execute()

    sessions = []
    for session in response.get("session", []):
        duration_ms = int(session["endTimeMillis"]) - int(session["startTimeMillis"])
        sessions.append({
            "start": session["startTimeMillis"],
            "end": session["endTimeMillis"],
            "duration_hours": round(duration_ms / 3_600_000, 2),
            "name": session.get("name", "Sono"),
        })

    return sessions


def sync_user_health_data(user_id: int, db):
    """
    Sincroniza os dados de saúde de um usuário silenciosamente.
    Chame esta função de um cron job ou task queue.
    """
    token_row = get_credentials_from_db(user_id, db)
    if not token_row or not token_row.get("refresh_token"):
        logger.warning(f"Usuário {user_id} sem refresh_token — pulando sync.")
        return False

    try:
        creds = build_credentials(token_row)

        # Renova o access_token se necessário
        if creds.expired or not creds.token:
            creds.refresh(Request())
            save_new_access_token(user_id, creds, db)
            logger.info(f"Token renovado para usuário {user_id}")

        service = build("fitness", "v1", credentials=creds)

        heart_data = fetch_heart_rate(service, days=1)
        sleep_data = fetch_sleep(service, days=7)

        # Salve os dados no banco conforme seu modelo
        # Exemplo genérico:
        for entry in heart_data:
            db.execute(
                """
                INSERT OR REPLACE INTO health_heart_rate (user_id, timestamp, bpm)
                VALUES (?, ?, ?)
                """,
                (user_id, entry["timestamp"], entry["bpm"])
            )

        for session in sleep_data:
            db.execute(
                """
                INSERT OR REPLACE INTO health_sleep (user_id, start_ms, end_ms, duration_hours)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, session["start"], session["end"], session["duration_hours"])
            )

        db.commit()
        logger.info(f"Sync concluído para usuário {user_id}: {len(heart_data)} BPM, {len(sleep_data)} sessões de sono.")
        return True

    except Exception as e:
        logger.error(f"Erro no sync do usuário {user_id}: {e}")
        return False


def sync_all_users(db):
    """
    Sincroniza todos os usuários com refresh_token ativo.
    Ideal para rodar a cada 1-4 horas via cron.
    """
    users = db.execute(
        "SELECT user_id FROM user_tokens WHERE refresh_token IS NOT NULL"
    ).fetchall()

    logger.info(f"Iniciando sync de {len(users)} usuários...")
    success = 0
    for row in users:
        if sync_user_health_data(row["user_id"], db):
            success += 1

    logger.info(f"Sync finalizado: {success}/{len(users)} usuários sincronizados.")
