from pathlib import Path
import logging
import os

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from database import db

# --- LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- APP ---
app = FastAPI(
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

api_router = APIRouter(prefix="/api")

# --- HEALTHCHECK / STATUS ---
@api_router.get("/")
async def api_root():
    return {"status": "ok", "message": "VitalFlow API online"}


@api_router.get("/health")
async def api_health():
    return {"status": "ok"}


# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://www.vitalflow.ia.br",
    "http://127.0.0.1:3001",
    "https://vitalflow-api-1hjc.onrender.com",
    "https://vitalflow.up.railway.app",
    "https://vitalflow.ia.br",
    "https://api.vitalflow.ia.br",
    "https://vitalflow-v3-git-main-vitalflow-wesleys-projects.vercel.app",
    "https://vitalflow-v3.vercel.app",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*-3000\.app\.github\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- IMPORTAÇÃO DAS ROTAS ---
from routes.auth import router as auth_router
from routes.analysis import router as analysis_router
from routes.wearables import router as wearables_router
from routes.dashboard import router as dashboard_router
from routes.smartwatch import router as smartwatch_router
from routes.gamification import router as gamification_router
from routes.health import router as health_router
from routes.payments import router as payments_router

# --- REGISTRO DAS ROTAS ---
api_router.include_router(auth_router)
api_router.include_router(analysis_router)
api_router.include_router(wearables_router)
api_router.include_router(dashboard_router)
api_router.include_router(smartwatch_router)
api_router.include_router(gamification_router)
api_router.include_router(health_router)
api_router.include_router(payments_router)

app.include_router(api_router)

# --- ROTA RAIZ ---
@app.get("/")
async def root():
    return {"status": "ok", "message": "VitalFlow online"}


# --- CAMINHO DOS ARQUIVOS ESTÁTICOS ---
static_path = Path(__file__).parent / "static"

if (static_path / "static").exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(static_path / "static")),
        name="static",
    )

# --- CATCH-ALL PARA O FRONTEND REACT ---
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json"]:
        return {"detail": "Not Found"}

    index_file = static_path / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {"detail": "Frontend missing"}