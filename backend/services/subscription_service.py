from datetime import datetime, timezone


def _parse_datetime(value):
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except Exception:
        return None


def get_user_access_state(user: dict) -> dict:
    is_b2b = bool(user.get("is_b2b", False))
    is_premium = bool(user.get("is_premium", False))
    plan = str(user.get("plan", "free")).lower()
    subscription_status = str(user.get("subscription_status", "inactive")).lower()
    trial_end_date = user.get("trial_end_date") or user.get("premium_expires_at")

    if is_b2b:
        return {
            "has_premium_access": True,
            "access_type": "b2b",
            "plan": "premium",
            "subscription_status": subscription_status,
            "trial_active": False,
            "trial_expired": False,
        }

    if subscription_status in {"active", "ativo", "trialing"} or plan == "premium":
        return {
            "has_premium_access": True,
            "access_type": "premium",
            "plan": "premium",
            "subscription_status": subscription_status,
            "trial_active": False,
            "trial_expired": False,
        }

    if plan == "trial" or (is_premium and trial_end_date):
        if trial_end_date:
            end = _parse_datetime(trial_end_date)
            if end:
                if datetime.now(timezone.utc) <= end:
                    return {
                        "has_premium_access": True,
                        "access_type": "trial",
                        "plan": "trial",
                        "subscription_status": subscription_status,
                        "trial_active": True,
                        "trial_expired": False,
                    }
                else:
                    return {
                        "has_premium_access": False,
                        "access_type": "free",
                        "plan": "free",
                        "subscription_status": subscription_status,
                        "trial_active": False,
                        "trial_expired": True,
                    }

    if is_premium:
        return {
            "has_premium_access": True,
            "access_type": "premium",
            "plan": "premium",
            "subscription_status": subscription_status,
            "trial_active": False,
            "trial_expired": False,
        }

    return {
        "has_premium_access": False,
        "access_type": "free",
        "plan": "free",
        "subscription_status": subscription_status,
        "trial_active": False,
        "trial_expired": False,
    }
