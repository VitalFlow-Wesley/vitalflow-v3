import uuid
import logging
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException
from database import db
from auth_utils import get_current_colaborador
from models import (
    WearableConnectionRequest, WearableConnectionResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/wearables/connect", response_model=WearableConnectionResponse)
async def connect_wearable(data: WearableConnectionRequest, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        device = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "provider": data.provider,
            "device_name": data.device_name,
            "is_connected": True,
            "last_sync": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wearable_devices.insert_one(device)
        return WearableConnectionResponse(
            id=device["id"], provider=device["provider"],
            device_name=device["device_name"],
            is_connected=device["is_connected"],
            last_sync=device["last_sync"], created_at=device["created_at"]
        )
    except Exception as e:
        logger.error(f"Error connecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/wearables", response_model=List[WearableConnectionResponse])
async def get_wearables(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        devices = await db.wearable_devices.find(
            {"colaborador_id": colaborador["id"]}, {"_id": 0}
        ).to_list(100)
        return [
            WearableConnectionResponse(
                id=d["id"], provider=d["provider"],
                device_name=d["device_name"],
                is_connected=d["is_connected"],
                last_sync=d.get("last_sync"), created_at=d["created_at"]
            )
            for d in devices
        ]
    except Exception as e:
        logger.error(f"Error fetching wearables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/wearables/{device_id}")
async def disconnect_wearable(device_id: str, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        result = await db.wearable_devices.delete_one({
            "id": device_id, "colaborador_id": colaborador["id"]
        })
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dispositivo nao encontrado")
        return {"status": "success", "message": "Dispositivo desconectado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wearables/oauth/callback")
async def wearable_oauth_callback(request: Request):
    try:
        import random
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        provider = body.get("provider", "google_health_connect")

        sync_data = {
            "hrv": random.randint(35, 85),
            "bpm": random.randint(58, 110),
            "bpm_average": random.randint(60, 80),
            "sleep_hours": round(random.uniform(4.5, 9.0), 1),
            "steps": random.randint(2000, 15000),
            "source": provider
        }

        existing = await db.wearable_devices.find_one(
            {"colaborador_id": colaborador["id"], "provider": provider}, {"_id": 0}
        )
        device_id = existing["id"] if existing else str(uuid.uuid4())

        if existing:
            await db.wearable_devices.update_one(
                {"id": device_id},
                {"$set": {"is_connected": True, "last_sync": datetime.now(timezone.utc).isoformat(), "oauth_token": "mock-token"}}
            )
        else:
            device = {
                "id": device_id,
                "colaborador_id": colaborador["id"],
                "provider": provider,
                "device_name": f"{provider.replace('_', ' ').title()}",
                "is_connected": True,
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "oauth_token": "mock-token",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wearable_devices.insert_one(device)

        return {
            "status": "authorized", "device_id": device_id,
            "provider": provider, "sync_data": sync_data,
            "message": f"Dispositivo {provider} autorizado e sincronizado automaticamente."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
