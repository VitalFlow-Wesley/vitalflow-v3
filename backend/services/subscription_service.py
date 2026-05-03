from datetime import datetime, timedelta, timezone

TRIAL_DAYS = 30


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


def _is_b2b(user: dict) -> bool:
    account_type = str(user.get("account_type", "personal")).lower()
    return bool(user.get("is_b2b", False)) or account_type in {"corporate", "empresa", "business"}


def _days_remaining(expires_at: datetime | None) -> int | None:
    if not expires_at:
        return None
    delta = expires_at - datetime.now(timezone.utc)
    return max(0, (delta.days + (1 if delta.seconds or delta.microseconds else 0)))


def get_trial_window(now: datetime | None = None) -> tuple[str, str]:
    start = now or datetime.now(timezone.utc)
    end = start + timedelta(days=TRIAL_DAYS)
    return start.isoformat(), end.isoformat()


def get_user_access_state(user: dict) -> dict:
    now = datetime.now(timezone.utc)
    plan = str(user.get("plan") or user.get("subscription_plan") or "free").lower()
    subscription_status = str(user.get("subscription_status") or "inactive").lower()
    is_premium_flag = bool(user.get("is_premium") or user.get("premium"))
    trial_start_date = user.get("trial_start_date")
    trial_end_date = user.get("trial_end_date") or user.get("premium_expires_at")
    premium_expires_at = user.get("premium_expires_at")
    trial_end = _parse_datetime(trial_end_date)
    premium_end = _parse_datetime(premium_expires_at)
    has_trial_history = bool(trial_start_date or trial_end_date)

    if _is_b2b(user):
        return {
            "has_premium_access": True,
            "is_premium": True,
            "premium": True,
            "access_type": "b2b",
            "plan": "premium",
            "tier": "premium",
            "subscription_status": subscription_status or "active",
            "trial_active": False,
            "trial_expired": False,
            "trial_available": False,
            "trial_days": TRIAL_DAYS,
            "trial_days_remaining": None,
            "trial_start_date": trial_start_date,
            "trial_end_date": trial_end_date,
            "premium_expires_at": premium_expires_at,
        }

    paid_status = subscription_status in {"active", "ativo"}
    paid_plan = plan == "premium" and subscription_status not in {"trialing", "trial", "trial_expired"}
    paid_not_expired = premium_end is None or now <= premium_end

    if (paid_status or paid_plan or (is_premium_flag and plan == "premium")) and paid_not_expired:
        return {
            "has_premium_access": True,
            "is_premium": True,
            "premium": True,
            "access_type": "premium",
            "plan": "premium",
            "tier": "premium",
            "subscription_status": "active",
            "trial_active": False,
            "trial_expired": False,
            "trial_available": False,
            "trial_days": TRIAL_DAYS,
            "trial_days_remaining": None,
            "trial_start_date": trial_start_date,
            "trial_end_date": trial_end_date,
            "premium_expires_at": premium_expires_at,
        }

    is_trial_plan = plan == "trial" or subscription_status in {"trialing", "trial"}
    if is_trial_plan or trial_end:
        if trial_end and now <= trial_end:
            return {
                "has_premium_access": True,
                "is_premium": True,
                "premium": True,
                "access_type": "trial",
                "plan": "trial",
                "tier": "premium",
                "subscription_status": "trialing",
                "trial_active": True,
                "trial_expired": False,
                "trial_available": False,
                "trial_days": TRIAL_DAYS,
                "trial_days_remaining": _days_remaining(trial_end),
                "trial_start_date": trial_start_date,
                "trial_end_date": trial_end_date,
                "premium_expires_at": trial_end_date,
            }

        return {
            "has_premium_access": False,
            "is_premium": False,
            "premium": False,
            "access_type": "free",
            "plan": "free",
            "tier": "free",
            "subscription_status": "trial_expired",
            "trial_active": False,
            "trial_expired": True,
            "trial_available": False,
            "trial_days": TRIAL_DAYS,
            "trial_days_remaining": 0,
            "trial_start_date": trial_start_date,
            "trial_end_date": trial_end_date,
            "premium_expires_at": trial_end_date,
        }

    return {
        "has_premium_access": False,
        "is_premium": False,
        "premium": False,
        "access_type": "free",
        "plan": "free",
        "tier": "free",
        "subscription_status": "inactive",
        "trial_active": False,
        "trial_expired": False,
        "trial_available": not has_trial_history,
        "trial_days": TRIAL_DAYS,
        "trial_days_remaining": None,
        "trial_start_date": trial_start_date,
        "trial_end_date": trial_end_date,
        "premium_expires_at": premium_expires_at,
    }
