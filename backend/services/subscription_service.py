from datetime import datetime, timezone

def get_user_access_state(user: dict) -> dict:
    is_b2b = bool(user.get("is_b2b", False))
    plan = str(user.get("plan", "free")).lower()
    subscription_status = str(user.get("subscription_status", "inactive")).lower()
    trial_end_date = user.get("trial_end_date")

    if is_b2b:
        return {
            "has_premium_access": True,
            "access_type": "b2b",
            "plan": "premium",
            "subscription_status": subscription_status,
            "trial_active": False,
            "trial_expired": False,
        }

    if subscription_status == "active":
        return {
            "has_premium_access": True,
            "access_type": "premium",
            "plan": "premium",
            "subscription_status": subscription_status,
            "trial_active": False,
            "trial_expired": False,
        }

    if plan == "trial":
        if trial_end_date:
            try:
                end = datetime.fromisoformat(trial_end_date)
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)

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
            except Exception:
                pass

    return {
        "has_premium_access": False,
        "access_type": "free",
        "plan": "free",
        "subscription_status": subscription_status,
        "trial_active": False,
        "trial_expired": False,
    }