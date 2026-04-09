from database import db, client
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Importação das Rotas ---
from routes.auth import router as auth_router
from routes.analysis import router as analysis_router
from routes.wearables import router as wearables_router
from routes.dashboard import router as dashboard_router
from routes.smartwatch import router as smartwatch_router
from routes.gamification import router as gamification_router
from routes.health import router as health_router
from routes.payments import router as payments_router

api_router.include_router(auth_router)
api_router.include_router(analysis_router)
api_router.include_router(wearables_router)
api_router.include_router(dashboard_router)
api_router.include_router(smartwatch_router)
api_router.include_router(gamification_router)
api_router.include_router(health_router)
api_router.include_router(payments_router)

app.include_router(api_router)

# --- CORS PARA O LINK 1HJC ---
origins = ["https://vitalflow-api-1hjc.onrender.com", "http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- GPS DOS ARQUIVOS ---
static_path = Path(__file__).parent / "static"

# Servir a subpasta static (onde ficam JS e CSS)
if (static_path / "static").exists():
    app.mount("/static", StaticFiles(directory=str(static_path / "static")), name="static")

# Catch-all: Entrega o index.html para qualquer outra rota
@app.get("/{catchall:path}")
async def serve_react_app(request: Request, catchall: str):
    if catchall.startswith("api"): return {"detail": "Not Found"}
    index_file = static_path / "index.html"
    return FileResponse(index_file) if index_file.exists() else {"detail": "Frontend missing"}
