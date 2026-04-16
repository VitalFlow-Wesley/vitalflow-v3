from pathlib import Path
import logging
import os

from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from database import db, client

# --- LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- APP ---
app = FastAPI()
api_router = APIRouter(prefix="/api")

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

# --- CORS ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://vitalflow-api-1hjc.onrender.com",
    "https://vitalflow.up.railway.app",
    "https://vitalflow.ia.br",
    "https://vitalflow-v3-git-main-vitalflow-wesleys-projects.vercel.app",
    "https://vitalflow-v3.vercel.app",
]

# Se quiser testar em outro dispositivo na mesma rede depois,
# adicione aqui também algo como:
# "http://192.168.1.9:3000",

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CAMINHO DOS ARQUIVOS ESTÁTICOS ---
static_path = Path(__file__).parent / "static"

# Servir a subpasta static (JS, CSS, assets)
if (static_path / "static").exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(static_path / "static")),
        name="static"
    )

# --- CATCH-ALL PARA O FRONTEND REACT ---
@app.get("/{catchall:path}")
async def serve_react_app(request: Request, catchall: str):
    if catchall.startswith("api"):
        return {"detail": "Not Found"}

    index_file = static_path / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {"detail": "Frontend missing"}