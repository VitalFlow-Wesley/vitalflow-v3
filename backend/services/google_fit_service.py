"""
Google Fit Integration Service v3.1
Extracao real de BPM, Steps e Sleep com granularidade horaria.
Deteccao de exercicio, calculo de recuperacao por sono.
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
    "https://www.googleapis.com/auth/fitness.nutrition.read",
    "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
]

GOOGLE_FIT_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_FIT_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_FIT_API_BASE = "https://www.googleapis.com/fitness/v1/users/me"

# Sleep segment types (Google Fit classification)
SLEEP_TYPES = {
    1: "awake",
    2: "sleep",       # generic sleep
    3: "out_of_bed",
    4: "light_sleep",
    5: "deep_sleep",
    6: "rem",
}


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


async def fetch_biometrics(access_token: str) -> dict | None:
    """Busca dados reais do Google Fit: BPM, Steps, Sleep com granularidade horaria."""
    if not access_token:
        return None
    try:
        import httpx
        headers = {"Authorization": f"Bearer {access_token}"}
        
        now = datetime.now(timezone.utc)
        now_ms = int(now.timestamp() * 1000)
        day_ms = 86400000
        hour_ms = 3600000
        
        # BUSCA APENAS AS ULTIMAS 24 HORAS PARA NAO POLUIR OS DADOS
        start_ms = now_ms - day_ms  

        # Referencia da meia-noite de hoje para contar os passos corretos
        start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        start_of_day_ms = int(start_of_day.timestamp() * 1000)

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Heart rate (hourly buckets for exercise detection)
            hr_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.heart_rate.bpm"}],
                    "bucketByTime": {"durationMillis": hour_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Steps (hourly buckets for exercise detection)
            steps_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.step_count.delta"}],
                    "bucketByTime": {"durationMillis": hour_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Sleep segments (last 24h)
            sleep_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.sleep.segment"}, {"dataTypeName": "com.google.activity.segment"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Calorias
            calories_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.calories.expended"}, {"dataTypeName": "com.google.calories.bmr"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Distância
            distance_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.distance.delta"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # Minutos Ativos
            active_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.active_minutes"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            # SpO2 (oxygen saturation)
            spo2_response = await client.post(
                f"{GOOGLE_FIT_API_BASE}/dataset:aggregate",
                headers=headers,
                json={
                    "aggregateBy": [{"dataTypeName": "com.google.oxygen_saturation"}],
                    "bucketByTime": {"durationMillis": day_ms},
                    "startTimeMillis": start_ms,
                    "endTimeMillis": now_ms,
                }
            )

            result = {
                "source": "google_fit",
                "synced_at": now.isoformat(),
                "has_real_data": False,
            }

            # ── Parse Heart Rate (hourly) ──
            all_bpm = []
            hourly_bpm = {}
            if hr_response.status_code == 200:
                hr_data = hr_response.json()
                for bucket in hr_data.get("bucket", []):
                    bucket_start = int(bucket.get("startTimeMillis", 0))
                    hour_key = datetime.fromtimestamp(bucket_start / 1000, tz=timezone.utc).strftime("%H:00")
                    bucket_bpm = []
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "fpVal" in val:
                                    bpm_val = round(val["fpVal"])
                                    all_bpm.append(bpm_val)
                                    bucket_bpm.append(bpm_val)
                    if bucket_bpm:
                        hourly_bpm[hour_key] = {
                            "avg": round(sum(bucket_bpm) / len(bucket_bpm)),
                            "max": max(bucket_bpm),
                            "min": min(bucket_bpm),
                            "count": len(bucket_bpm),
                        }

                if all_bpm:
                    # Usa o ultimo batimento registrado para a tela inicial
                    result["bpm"] = all_bpm[-1]
                    result["bpm_average"] = round(sum(all_bpm) / len(all_bpm))
                    result["bpm_max"] = max(all_bpm)
                    result["bpm_min"] = min(all_bpm)
                    
                    # HRV estimado via BPM de repouso
                    bpm_repouso = result["bpm_average"]
                    hrv_estimado = round(1000 / bpm_repouso * 2.2)
                    hrv_estimado = max(20, min(80, hrv_estimado))
                    result["hrv"] = hrv_estimado
                    result["hrv_source"] = "estimated_from_resting_bpm"
                    result["hourly_bpm"] = hourly_bpm
                    result["has_real_data"] = True

            # ── Parse Steps (hourly) ──
            total_steps = 0
            hourly_steps = {}
            if steps_response.status_code == 200:
                steps_data = steps_response.json()
                for bucket in steps_data.get("bucket", []):
                    bucket_start = int(bucket.get("startTimeMillis", 0))
                    hour_key = datetime.fromtimestamp(bucket_start / 1000, tz=timezone.utc).strftime("%H:00")
                    bucket_steps = 0
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "intVal" in val:
                                    bucket_steps += val["intVal"]
                    
                    # Soma apenas os passos dados apos a meia-noite de hoje
                    if bucket_start >= start_of_day_ms:
                        total_steps += bucket_steps
                        
                    if bucket_steps > 0:
                        hourly_steps[hour_key] = bucket_steps

                result["steps"] = total_steps
                result["hourly_steps"] = hourly_steps
                if total_steps > 0:
                    result["has_real_data"] = True

            # ── Parse Sleep (quality breakdown) ──
            sleep_segments = []
            total_sleep_ms = 0
            deep_sleep_ms = 0
            light_sleep_ms = 0
            rem_sleep_ms = 0
            if sleep_response.status_code == 200:
                sleep_data = sleep_response.json()
                for bucket in sleep_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            start_ns = int(point.get("startTimeNanos", 0))
                            end_ns = int(point.get("endTimeNanos", 0))
                            duration_ms = (end_ns - start_ns) / 1e6
                            segment_type = 2  # default generic sleep
                            for val in point.get("value", []):
                                if "intVal" in val:
                                    segment_type = val["intVal"]

                            type_name = SLEEP_TYPES.get(segment_type, "sleep")
                            if type_name in ("sleep", "light_sleep", "deep_sleep", "rem"):
                                total_sleep_ms += duration_ms
                            if type_name == "deep_sleep":
                                deep_sleep_ms += duration_ms
                            elif type_name == "light_sleep" or type_name == "sleep":
                                light_sleep_ms += duration_ms
                            elif type_name == "rem":
                                rem_sleep_ms += duration_ms

                            sleep_segments.append({
                                "type": type_name,
                                "duration_min": round(duration_ms / 60000, 1),
                            })

                if total_sleep_ms > 0:
                    result["sleep_hours"] = round(total_sleep_ms / 3600000, 1)
                    result["sleep_quality"] = {
                        "deep_hours": round(deep_sleep_ms / 3600000, 1),
                        "light_hours": round(light_sleep_ms / 3600000, 1),
                        "rem_hours": round(rem_sleep_ms / 3600000, 1),
                        "segments": sleep_segments[:20],  # limite para nao encher o doc
                    }
                    result["has_real_data"] = True

            # ── Parse Calorias ──
            if calories_response.status_code == 200:
                cal_data = calories_response.json()
                total_cal = 0.0
                for bucket in cal_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "fpVal" in val:
                                    total_cal += val["fpVal"]
                if total_cal > 0:
                    result["calories"] = round(total_cal, 1)
                    result["has_real_data"] = True

            # ── Parse Distância ──
            if distance_response.status_code == 200:
                dist_data = distance_response.json()
                total_dist = 0.0
                for bucket in dist_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "fpVal" in val:
                                    total_dist += val["fpVal"]
                if total_dist > 0:
                    result["distance_km"] = round(total_dist / 1000, 2)
                    result["has_real_data"] = True

            # ── Parse Minutos Ativos ──
            if active_response.status_code == 200:
                active_data = active_response.json()
                total_active = 0
                for bucket in active_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "intVal" in val:
                                    total_active += val["intVal"]
                if total_active > 0:
                    result["active_minutes"] = total_active
                    result["has_real_data"] = True

            # ── Parse SpO2 ──
            if spo2_response.status_code == 200:
                spo2_data = spo2_response.json()
                all_spo2 = []
                for bucket in spo2_data.get("bucket", []):
                    for dataset in bucket.get("dataset", []):
                        for point in dataset.get("point", []):
                            for val in point.get("value", []):
                                if "fpVal" in val and val["fpVal"] > 0:
                                    all_spo2.append(round(val["fpVal"] * 100, 1))
                if all_spo2:
                    # Usa a ultima leitura disponivel
                    result["spo2"] = all_spo2[-1]
                    result["spo2_min"] = min(all_spo2)
                    result["has_real_data"] = True

            # ── Exercise Detection (hourly cross-reference) ──
            exercise_hours = []
            rest_high_bpm_hours = []
            for hour_key, bpm_data in hourly_bpm.items():
                steps_in_hour = hourly_steps.get(hour_key, 0)
                avg_bpm = bpm_data["avg"]
                # BPM alto COM passos altos = exercicio
                if avg_bpm > 90 and steps_in_hour > 300:
                    exercise_hours.append({
                        "hour": hour_key,
                        "avg_bpm": avg_bpm,
                        "steps": steps_in_hour,
                        "classification": "exercicio"
                    })
                # BPM alto SEM passos = potencial estresse
                elif avg_bpm > 95 and steps_in_hour < 100:
                    rest_high_bpm_hours.append({
                        "hour": hour_key,
                        "avg_bpm": avg_bpm,
                        "steps": steps_in_hour,
                        "classification": "estresse_potencial"
                    })

            result["activity_analysis"] = {
                "exercise_hours": exercise_hours,
                "rest_high_bpm_hours": rest_high_bpm_hours,
                "exercise_detected": len(exercise_hours) > 0,
                "stress_periods_detected": len(rest_high_bpm_hours) > 0,
                "total_exercise_hours": len(exercise_hours),
                "total_stress_hours": len(rest_high_bpm_hours),
            }

            # ── Sleep Recovery Factor ──
            sleep_h = result.get("sleep_hours", 7)
            if sleep_h >= 7:
                recovery_factor = 1.0
                recovery_label = "Recuperacao Otima"
            elif sleep_h >= 6:
                recovery_factor = 0.85
                recovery_label = "Recuperacao Moderada"
            elif sleep_h >= 5:
                recovery_factor = 0.7
                recovery_label = "Recuperacao Insuficiente"
            else:
                recovery_factor = 0.55
                recovery_label = "Recuperacao Critica"

            result["recovery"] = {
                "factor": recovery_factor,
                "label": recovery_label,
                "sleep_hours": sleep_h,
                "stress_threshold_adjustment": round((1 - recovery_factor) * 15),
            }

            return result

    except Exception as e:
        logger.error(f"Error fetching Google Fit biometrics: {e}")
        return None