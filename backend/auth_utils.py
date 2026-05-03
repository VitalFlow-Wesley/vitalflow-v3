import bcrypt
import jwt
import os
from datetime import datetime, timezone, timedelta
from fastapi import Request, HTTPException
from database import db
from services.subscription_service import get_user_access_state

JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-me')


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(colaborador_id: str, email: str) -> str:
    payload = {
        "sub": colaborador_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(colaborador_id: str) -> str:
    payload = {
        "sub": colaborador_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


async def get_current_colaborador(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Nao autenticado")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo de token invalido")

        colaborador = await db.colaboradores.find_one({"id": payload["sub"]}, {"_id": 0})
        if not colaborador:
            raise HTTPException(status_code=401, detail="Colaborador nao encontrado")

        colaborador.pop("password_hash", None)
        access = get_user_access_state(colaborador)
        colaborador["is_premium"] = access["has_premium_access"]
        colaborador["has_premium_access"] = access["has_premium_access"]
        colaborador["access_type"] = access["access_type"]
        colaborador["plan"] = access["plan"]
        colaborador["subscription_status"] = access["subscription_status"]
        colaborador["trial_active"] = access["trial_active"]
        colaborador["trial_expired"] = access["trial_expired"]
        colaborador["trial_available"] = access["trial_available"]
        colaborador["trial_days_remaining"] = access["trial_days_remaining"]
        colaborador["premium_expires_at"] = access["premium_expires_at"]
        return colaborador
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")
