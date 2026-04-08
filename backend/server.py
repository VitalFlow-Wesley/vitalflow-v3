"""
VitalFlow API - Copiloto Corporativo de Longevidade
Arquivo principal: configuracao da app, CORS, startup/shutdown.
"""
from database import db, client
from fastapi.staticfiles import StaticFiles
from auth_utils import hash_password
from models import Colaborador, CorporateDomain

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
from datetime import datetime, timezone
import os
import logging

# ─── Logging ───
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ─── App ───
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Import route modules ───
from routes.auth import router as auth_router
from routes.analysis import router as analysis_router
from routes.wearables import router as wearables_router
from routes.dashboard import router as dashboard_router
from routes.smartwatch import router as smartwatch_router
from routes.gamification import router as gamification_router
from routes.health import router as health_router
from routes.payments import router as payments_router

# ─── Include all routers ───
api_router.include_router(auth_router)
api_router.include_router(analysis_router)
api_router.include_router(wearables_router)
api_router.include_router(dashboard_router)
api_router.include_router(smartwatch_router)
api_router.include_router(gamification_router)
api_router.include_router(health_router)
api_router.include_router(payments_router)


@api_router.get("/")
async def root():
    return {"message": "VitalFlow API - Copiloto Corporativo de Longevidade"}


app.include_router(api_router)

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Startup ───
@app.on_event("startup")
async def startup_event():
    try:
        await db.colaboradores.create_index("email", unique=True)
        await db.gamification_events.create_index([("colaborador_id", 1), ("created_at", -1)])
        logger.info("Database indexes created")

        # Migrate existing users: add gamification fields if missing
        await db.colaboradores.update_many(
            {"energy_points": {"$exists": False}},
            {"$set": {
                "energy_points": 0, "current_streak": 0, "longest_streak": 0,
                "last_nudge_date": None, "badges": [], "is_premium": False
            }}
        )

        # Seed admin
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@vitalflow.com').lower()
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin123!@#')

        existing_admin = await db.colaboradores.find_one({"email": admin_email}, {"_id": 0})

        if not existing_admin:
            admin_domain = admin_email.split('@')[1] if '@' in admin_email else None
            admin_is_corporate = False
            if admin_domain:
                corp_domain = await db.corporate_domains.find_one({"domain": admin_domain}, {"_id": 0})
                admin_is_corporate = corp_domain is not None

            admin = Colaborador(
                nome="Administrador", email=admin_email,
                password_hash=hash_password(admin_password),
                data_nascimento="1990-01-01", setor="Administrativo",
                nivel_acesso="Gestor",
                account_type="corporate" if admin_is_corporate else "personal",
                domain=admin_domain if admin_is_corporate else None
            )
            doc = admin.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.colaboradores.insert_one(doc)
            logger.info(f"Admin seeded: {admin_email}")

        # Seed corporate domains
        corporate_domains = [
            {"domain": "brisanet.com.br", "company_name": "Brisanet"},
            {"domain": "vitalflow.com", "company_name": "VitalFlow"},
            {"domain": "emergent.sh", "company_name": "Emergent"}
        ]

        for domain_data in corporate_domains:
            existing_domain = await db.corporate_domains.find_one(
                {"domain": domain_data["domain"]}, {"_id": 0}
            )
            if not existing_domain:
                domain_doc = CorporateDomain(
                    domain=domain_data["domain"],
                    company_name=domain_data["company_name"]
                )
                doc = domain_doc.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                await db.corporate_domains.insert_one(doc)
                logger.info(f"Corporate domain seeded: {domain_data['domain']}")

        # Write test credentials
        Path("/app/memory").mkdir(exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(f"""# VitalFlow - Credenciais de Teste

## Admin/Gestor
- Email: {admin_email}
- Senha: {admin_password}
- Nivel: Gestor
- Setor: Administrativo

## Endpoints de Autenticacao
- POST /api/auth/register - Cadastro
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Dados do colaborador logado
- PUT /api/auth/profile - Atualizar perfil
- POST /api/auth/forgot-password - Recuperacao de senha

## Endpoints Protegidos
- POST /api/analyze - Criar analise
- GET /api/history - Historico de analises
- GET /api/wearables - Dispositivos conectados
- GET /api/dashboard/metrics - Metricas (apenas gestores)
- GET /api/predictive/alert - Alerta preditivo (Premium/Corporate only)

## Gamificacao
- POST /api/gamification/follow-nudge - Seguir nudge (+50 pts)
- GET /api/gamification/stats - Estatisticas
- GET /api/gamification/leaderboard - Top 10

## Premium
- GET /api/billing/plan - Info do plano
- POST /api/billing/upgrade - Upgrade para Premium (mock)

## Smartwatch
- POST /api/smartwatch/analyze - Analise em tempo real com IA
- POST /api/smartwatch/webhook - Webhook para dados reais
- GET /api/smartwatch/history - Historico de alertas
""")
        logger.info("Test credentials written to /app/memory/test_credentials.md")

    except Exception as e:
        logger.error(f"Startup error: {str(e)}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
# Servir o frontend (Site)
app.mount("/", StaticFiles(directory="static", html=True), name="static")