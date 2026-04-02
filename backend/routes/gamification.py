import uuid
import logging
from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Request, HTTPException
from database import db
from auth_utils import get_current_colaborador
from models import (
    FollowNudgeRequest, GamificationStatsResponse, PlanInfoResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/gamification/follow-nudge")
async def follow_nudge(data: FollowNudgeRequest, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        colab_id = colaborador["id"]
        today = date.today().isoformat()

        existing = await db.gamification_events.find_one(
            {"colaborador_id": colab_id, "analysis_id": data.analysis_id, "event_type": "nudge_followed"},
            {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Nudge ja seguido para esta analise")

        last_nudge_date = colaborador.get("last_nudge_date")
        current_streak = colaborador.get("current_streak", 0)
        longest_streak = colaborador.get("longest_streak", 0)

        if last_nudge_date == today:
            pass
        elif last_nudge_date == (date.today() - timedelta(days=1)).isoformat():
            current_streak += 1
        else:
            current_streak = 1

        if current_streak > longest_streak:
            longest_streak = current_streak

        points_earned = 50
        bonus_events = []

        if current_streak == 3 and last_nudge_date != today:
            points_earned += 100
            bonus_events.append({"event_type": "streak_bonus", "points": 100, "streak": 3})

        if current_streak == 7 and last_nudge_date != today:
            points_earned += 500
            badge = {
                "name": "Biohacker da Semana",
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "streak_cycle": current_streak // 7
            }
            badges = colaborador.get("badges", [])
            badges.append(badge)
            await db.colaboradores.update_one({"id": colab_id}, {"$set": {"badges": badges}})
            bonus_events.append({"event_type": "badge_earned", "badge": "Biohacker da Semana", "points": 500})

        if current_streak > 7 and current_streak % 7 == 0 and last_nudge_date != today:
            points_earned += 500
            badge = {
                "name": "Biohacker da Semana",
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "streak_cycle": current_streak // 7
            }
            badges = colaborador.get("badges", [])
            badges.append(badge)
            await db.colaboradores.update_one({"id": colab_id}, {"$set": {"badges": badges}})

        new_total = colaborador.get("energy_points", 0) + points_earned

        await db.colaboradores.update_one(
            {"id": colab_id},
            {"$set": {
                "energy_points": new_total, "current_streak": current_streak,
                "longest_streak": longest_streak, "last_nudge_date": today,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )

        event = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colab_id,
            "event_type": "nudge_followed",
            "analysis_id": data.analysis_id,
            "points_earned": points_earned,
            "streak_at_time": current_streak,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.gamification_events.insert_one(event)

        return {
            "points_earned": points_earned, "total_points": new_total,
            "current_streak": current_streak, "longest_streak": longest_streak,
            "bonus_events": bonus_events
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error following nudge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gamification/stats", response_model=GamificationStatsResponse)
async def get_gamification_stats(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        today = date.today().isoformat()
        nudges_today = await db.gamification_events.count_documents({
            "colaborador_id": colaborador["id"],
            "event_type": "nudge_followed",
            "created_at": {"$gte": today}
        })
        current_streak = colaborador.get("current_streak", 0)
        next_badge = max(0, 7 - (current_streak % 7)) if current_streak > 0 else 7

        return GamificationStatsResponse(
            energy_points=colaborador.get("energy_points", 0),
            current_streak=current_streak,
            longest_streak=colaborador.get("longest_streak", 0),
            badges=colaborador.get("badges", []),
            nudges_followed_today=nudges_today,
            next_badge_in=next_badge
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting gamification stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gamification/leaderboard")
async def get_leaderboard(request: Request):
    try:
        await get_current_colaborador(request)
        top_users = await db.colaboradores.find(
            {"energy_points": {"$gt": 0}},
            {"_id": 0, "nome": 1, "energy_points": 1, "current_streak": 1, "badges": 1}
        ).sort("energy_points", -1).limit(10).to_list(10)

        entries = []
        for i, u in enumerate(top_users):
            first_name = u["nome"].split()[0] if u.get("nome") else "Anon"
            last_initial = u["nome"].split()[-1][0] + "." if len(u.get("nome", "").split()) > 1 else ""
            has_badge = any(b.get("is_active") for b in u.get("badges", []))
            entries.append({
                "rank": i + 1, "nome": f"{first_name} {last_initial}",
                "energy_points": u.get("energy_points", 0),
                "current_streak": u.get("current_streak", 0),
                "has_badge": has_badge
            })
        return {"period": "all_time", "entries": entries}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/billing/plan", response_model=PlanInfoResponse)
async def get_plan(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        account_type = colaborador.get("account_type", "personal")
        is_premium = colaborador.get("is_premium", False)

        if account_type == "corporate":
            return PlanInfoResponse(
                plan="corporate", is_premium=True, account_type=account_type,
                limits={"analyses_limit": -1, "has_predictions": True, "has_detailed_nudge": True, "history_days": -1, "wearables_limit": -1}
            )

        today = date.today().isoformat()
        analyses_today = await db.analyses.count_documents({
            "colaborador_id": colaborador["id"], "timestamp": {"$gte": today}
        })

        if is_premium:
            return PlanInfoResponse(
                plan="premium", is_premium=True, account_type=account_type,
                limits={"analyses_today": analyses_today, "analyses_limit": -1, "has_predictions": True, "has_detailed_nudge": True, "history_days": -1, "wearables_limit": -1}
            )

        return PlanInfoResponse(
            plan="free", is_premium=False, account_type=account_type,
            limits={"analyses_today": analyses_today, "analyses_limit": 3, "has_predictions": False, "has_detailed_nudge": False, "history_days": 7, "wearables_limit": 1}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/billing/upgrade")
async def upgrade_plan(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador.get("is_premium"):
            return {"message": "Ja e Premium", "is_premium": True}

        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {"$set": {"is_premium": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Upgrade para Premium realizado!", "is_premium": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
