import os
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Response, HTTPException

from database import db
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_colaborador,
)
from models import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    AuthResponse,
    ColaboradorUpdate,
    Colaborador,
    DomainCheckResponse,
)
from services.subscription_service import get_user_access_state
from services.domain_service import check_corporate_domain

logger = logging.getLogger(__name__)
router = APIRouter()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    for key, value, max_age in [
        ("access_token", access_token, 3600),
        ("refresh_token", refresh_token, 604800),
    ]:
        response.set_cookie(
            key=key,
            value=value,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=max_age,
            path="/",
        )


async def _get_company_name(account_type: str, domain: str | None) -> str | None:
    if account_type == "corporate" and domain:
        corp = await db.corporate_domains.find_one(
            {"domain": domain},
            {"_id": 0, "company_name": 1},
        )
        if corp:
            return corp["company_name"]
    return None


def _build_auth_response(colab: dict, company_name: str | None = None) -> AuthResponse:
    access = get_user_access_state(colab)

    premium_expires_at = colab.get("trial_end_date") or colab.get("premium_expires_at")

    return AuthResponse(
        id=colab["id"],
        nome=colab["nome"],
        email=colab["email"],
        data_nascimento=colab["data_nascimento"],
        foto_url=colab.get("foto_url"),
        setor=colab["setor"],
        nivel_acesso=colab["nivel_acesso"],
        matricula=colab.get("matricula"),
        cargo=colab.get("cargo"),
        account_type=colab.get("account_type", "personal"),
        domain=colab.get("domain"),
        company_name=company_name,
        is_premium=access["has_premium_access"],
        premium_expires_at=premium_expires_at,
        energy_points=colab.get("energy_points", 0),
        current_streak=colab.get("current_streak", 0),
        must_change_password=colab.get("must_change_password", False),
        must_accept_lgpd=colab.get("must_accept_lgpd", False),
        plan=access["plan"],
        subscription_status=access["subscription_status"],
        is_b2b=bool(
            colab.get("is_b2b", False)
            or colab.get("account_type") == "corporate"
        ),
    )


@router.get("/auth/check-domain")
async def check_domain(email: str):
    try:
        is_corporate, domain, company_name = await check_corporate_domain(email)
        return DomainCheckResponse(
            is_corporate=is_corporate,
            domain=domain,
            company_name=company_name,
            account_type="corporate" if is_corporate else "personal",
        )
    except Exception as e:
        logger.error(f"Error checking domain: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/register", response_model=AuthResponse)
async def register(data: RegisterRequest, response: Response):
    try:
        email_lower = data.email.lower()
        existing = await db.colaboradores.find_one(
            {"email": email_lower},
            {"_id": 0},
        )

        # B2B por pre-cadastro: se email ja foi cadastrado pelo RH, vincular
        if existing:
            if existing.get("registered_by_rh") and existing.get("must_change_password"):
                await db.colaboradores.update_one(
                    {"id": existing["id"]},
                    {
                        "$set": {
                            "password_hash": hash_password(data.password),
                            "nome": data.nome,
                            "data_nascimento": data.data_nascimento.isoformat(),
                            "must_change_password": True,
                            "must_accept_lgpd": True,
                            "updated_at": datetime.now(timezone.utc).isoformat(),
                        }
                    },
                )

                updated = await db.colaboradores.find_one(
                    {"id": existing["id"]},
                    {"_id": 0},
                )

                _set_auth_cookies(
                    response,
                    create_access_token(updated["id"], updated["email"]),
                    create_refresh_token(updated["id"]),
                )

                company_name = await _get_company_name(
                    updated.get("account_type", "personal"),
                    updated.get("domain"),
                )
                return _build_auth_response(updated, company_name)

            raise HTTPException(status_code=400, detail="Email ja cadastrado")

        is_corporate, domain, company_name = await check_corporate_domain(email_lower)
        account_type = "corporate" if is_corporate else "personal"

        # Premium Trial NAO ativa no cadastro — ativa ao vincular wearable
        colaborador = Colaborador(
            nome=data.nome,
            email=email_lower,
            password_hash=hash_password(data.password),
            data_nascimento=data.data_nascimento.isoformat(),
            setor=data.setor,
            nivel_acesso=data.nivel_acesso,
            account_type=account_type,
            domain=domain,
            is_premium=False,
            premium_expires_at=None,
        )

        doc = colaborador.model_dump()
        doc["plan"] = "free"
        doc["subscription_status"] = "inactive"
        doc["trial_start_date"] = None
        doc["trial_end_date"] = None
        doc["is_b2b"] = account_type == "corporate"

        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()

        if isinstance(doc.get("updated_at"), datetime):
            doc["updated_at"] = doc["updated_at"].isoformat()

        await db.colaboradores.insert_one(doc)

        _set_auth_cookies(
            response,
            create_access_token(colaborador.id, colaborador.email),
            create_refresh_token(colaborador.id),
        )

        return _build_auth_response(doc, company_name if is_corporate else None)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response, request: Request):
    try:
        email_lower = data.email.lower()
        colaborador = await db.colaboradores.find_one(
            {"email": email_lower},
            {"_id": 0},
        )

        if not colaborador or not verify_password(data.password, colaborador["password_hash"]):
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")

        _set_auth_cookies(
            response,
            create_access_token(colaborador["id"], colaborador["email"]),
            create_refresh_token(colaborador["id"]),
        )

        company_name = await _get_company_name(
            colaborador.get("account_type", "personal"),
            colaborador.get("domain"),
        )
        return _build_auth_response(colaborador, company_name)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    from auth_utils import decode_token

    refresh_token_value = request.cookies.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=401, detail="Refresh token nao encontrado.")

    payload = decode_token(refresh_token_value)
    if not payload:
        raise HTTPException(status_code=401, detail="Refresh token invalido ou expirado.")

    colaborador = await db.colaboradores.find_one(
        {"id": payload.get("sub")},
        {"_id": 0},
    )
    if not colaborador:
        raise HTTPException(status_code=401, detail="Usuario nao encontrado.")

    new_access = create_access_token(colaborador["id"], colaborador["email"])
    new_refresh = create_refresh_token(colaborador["id"])
    _set_auth_cookies(response, new_access, new_refresh)

    return {"ok": True}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logout realizado com sucesso"}


@router.post("/auth/change-password")
async def change_password(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        new_password = body.get("new_password", "")

        if len(new_password) < 6:
            raise HTTPException(
                status_code=400,
                detail="Senha deve ter no minimo 6 caracteres.",
            )

        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {
                "$set": {
                    "password_hash": hash_password(new_password),
                    "must_change_password": False,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

        return {"message": "Senha alterada com sucesso."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/accept-lgpd")
async def accept_lgpd(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {
                "$set": {
                    "must_accept_lgpd": False,
                    "lgpd_accepted_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )
        return {"message": "Termos aceitos com sucesso."}

    except Exception as e:
        logger.error(f"Error accepting LGPD: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/me", response_model=AuthResponse)
async def get_me(request: Request):
    colaborador = await get_current_colaborador(request)
    company_name = await _get_company_name(
        colaborador.get("account_type", "personal"),
        colaborador.get("domain"),
    )
    return _build_auth_response(colaborador, company_name)


@router.put("/auth/profile", response_model=AuthResponse)
async def update_profile(data: ColaboradorUpdate, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}

        if data.nome:
            update_data["nome"] = data.nome
        if data.data_nascimento:
            update_data["data_nascimento"] = data.data_nascimento.isoformat()
        if data.foto_base64:
            update_data["foto_url"] = f"data:image/jpeg;base64,{data.foto_base64}"

        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {"$set": update_data},
        )

        updated = await db.colaboradores.find_one(
            {"id": colaborador["id"]},
            {"_id": 0},
        )

        company_name = await _get_company_name(
            updated.get("account_type", "personal"),
            updated.get("domain"),
        )
        return _build_auth_response(updated, company_name)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    try:
        email_lower = data.email.lower()
        colaborador = await db.colaboradores.find_one(
            {"email": email_lower},
            {"_id": 0, "id": 1, "nome": 1},
        )

        if not colaborador:
            raise HTTPException(
                status_code=404,
                detail="Email nao encontrado no sistema.",
            )

        temp_password = f"Reset{uuid.uuid4().hex[:6]}!"
        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {
                "$set": {
                    "password_hash": hash_password(temp_password),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

        return {
            "message": f"Senha temporaria gerada para {colaborador['nome']}. Em producao, seria enviada por email.",
            "temp_password": temp_password,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in forgot_password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        # ✅ ADICIONE ESTE TRECHO NO FINAL DO auth.py (antes do último endpoint)
# Alias /me → /auth/me para compatibilidade com chamadas antigas
@router.get("/me", response_model=AuthResponse)
async def get_me_alias(request: Request):
    """Alias de /auth/me para compatibilidade."""
    colaborador = await get_current_colaborador(request)
    company_name = await _get_company_name(
        colaborador.get("account_type", "personal"),
        colaborador.get("domain"),
    )
    return _build_auth_response(colaborador, company_name)


@router.post("/seed-admin")
async def seed_admin_endpoint():
    try:
        admin_email = os.environ.get("ADMIN_EMAIL", "admin@vitalflow.com").lower()
        admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!@#")

        admin_domain = admin_email.split("@")[1] if "@" in admin_email else None
        admin_is_corporate = False

        if admin_domain:
            corp_domain = await db.corporate_domains.find_one(
                {"domain": admin_domain},
                {"_id": 0},
            )
            admin_is_corporate = corp_domain is not None

        existing_admin = await db.colaboradores.find_one(
            {"email": admin_email},
            {"_id": 0, "id": 1},
        )

        if existing_admin:
            await db.colaboradores.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "password_hash": hash_password(admin_password),
                        "account_type": "corporate" if admin_is_corporate else "personal",
                        "domain": admin_domain if admin_is_corporate else None,
                        "nivel_acesso": "CEO",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }
                },
            )
            return {
                "message": f"Admin updated: {admin_email}",
                "account_type": "corporate" if admin_is_corporate else "personal",
            }

        admin = Colaborador(
            nome="Administrador",
            email=admin_email,
            password_hash=hash_password(admin_password),
            data_nascimento="1990-01-01",
            setor="Administrativo",
            nivel_acesso="CEO",
            account_type="corporate" if admin_is_corporate else "personal",
            domain=admin_domain if admin_is_corporate else None,
        )

        doc = admin.model_dump()

        if isinstance(doc.get("created_at"), datetime):
            doc["created_at"] = doc["created_at"].isoformat()

        if isinstance(doc.get("updated_at"), datetime):
            doc["updated_at"] = doc["updated_at"].isoformat()

        await db.colaboradores.insert_one(doc)

        return {
            "message": f"Admin created: {admin_email}",
            "account_type": "corporate" if admin_is_corporate else "personal",
        }

    except Exception as e:
        logger.error(f"Error seeding admin: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))