"""
Google Fit Integration Service
Preparado para receber credenciais OAuth 2.0 reais.

Para ativar:
1. Crie um projeto no Google Cloud Console
2. Ative a Fitness API
3. Configure a tela de consentimento OAuth
4. Gere credenciais OAuth 2.0 (Web Application)
5. Adicione as chaves no .env:
   GOOGLE_FIT_CLIENT_ID=seu_client_id
   GOOGLE_FIT_CLIENT_SECRET=seu_client_secret
   GOOGLE_FIT_REDIRECT_URI=https://seudominio.com/api/wearables/google-fit/callback
"""
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

GOOGLE_FIT_CLIENT_ID = os.environ.get("GOOGLE_FIT_CLIENT_ID", "")
GOOGLE_FIT_CLIENT_SECRET = os.environ.get("GOOGLE_FIT_CLIENT_SECRET", "")
GOOGLE_FIT_REDIRECT_URI = os.environ.get("GOOGLE_FIT_REDIRECT_URI", "")

GOOGLE_FIT_SCOPES = [
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]

GOOGLE_FIT_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_FIT_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_FIT_API_BASE = "https://www.googleapis.com/fitness/v1/users/me"


def is_configured() -> bool:
    return bool(GOOGLE_FIT_CLIENT_ID and GOOGLE_FIT_CLIENT_SECRET)


def get_auth_url(state: str = "") -> str:
    if not is_configured():
        return ""
    params = {
        "client_id": GOOGLE_FIT_CLIENT_ID,
        "redirect_uri": GOOGLE_FIT_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_FIT_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_FIT_AUTH_URL}?{query}"


async def exchange_code(code: str) -> dict | None:
    if not is_configured():
        return None
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_FIT_TOKEN_URL, data={
                "code": code,
                "client_id": GOOGLE_FIT_CLIENT_ID,
                "client_secret": GOOGLE_FIT_CLIENT_SECRET,
                "redirect_uri": GOOGLE_FIT_REDIRECT_URI,
                "grant_type": "authorization_code",
            })
            if response.status_code == 200:
                return response.json()
            logger.error(f"Google Fit token exchange failed: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error exchanging Google Fit code: {e}")
        return None


async def fetch_biometrics(access_token: str) -> dict | None:
    if not access_token:
        return None
    try:
        import httpx
        headers = {"Authorization": f"Bearer {access_token}"}
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        day_ms = 86400000

        async with httpx.AsyncClient() as client:
            # Heart rate (BPM)
            hr_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.heart_rate.bpm"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": now_ms - day_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Sleep
            sleep_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.sleep.segment"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": now_ms - day_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Steps
            steps_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": now_ms - day_ms,
                    "endTimeMillis": now_ms,
                }
            )

            result = {"source": "google_fit", "synced_at": datetime.now(timezone.utc).isoformat()}

            # Parse heart rate
            if hr_response.status_code == 200:
                hr_data = hr_response.json()
                bpm_values = []
                for bucket in hr_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "fpVal" in val:
                                    bpm_values.append(val["fpVal"])
                if bpm_values:
                    result["bpm"] = round(sum(bpm_values) / len(bpm_values))
                    result["bpm_average"] = round(min(bpm_values))
                    result["hrv"] = max(10, round(60 - (max(bpm_values) - min(bpm_values))))

            # Parse sleep
            if sleep_response.status_code == 200:
                sleep_data = sleep_response.json()
                total_sleep_ms = 0
                for bucket in sleep_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            start = int(point.get("startTimeNanos", 0)) / 1e6
                            end = int(point.get("endTimeNanos", 0)) / 1e6
                            total_sleep_ms += (end - start)
                if total_sleep_ms > 0:
                    result["sleep_hours"] = round(total_sleep_ms / 3600000, 1)

            # Parse steps
            if steps_response.status_code == 200:
                steps_data = steps_response.json()
                total_steps = 0
                for bucket in steps_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "intVal" in val:
                                    total_steps += val["intVal"]
                result["steps"] = total_steps

            return result
    except Exception as e:
        logger.error(f"Error fetching Google Fit biometrics: {e}")
        return None


async def refresh_access_token(refresh_token: str) -> dict | None:
    """Usa o refresh_token para obter um novo access_token do Google."""
    if not is_configured() or not refresh_token:
        return None
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_FIT_TOKEN_URL, data={
                "client_id": GOOGLE_FIT_CLIENT_ID,
                "client_secret": GOOGLE_FIT_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            })
            if response.status_code == 200:
                return response.json()
            logger.error(f"Google Fit token refresh failed: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error refreshing Google Fit token: {e}")
        return None
