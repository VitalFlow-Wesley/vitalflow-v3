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

# Rotas (Importações automáticas)
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

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# GPS das pastas
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

# Servir os arquivos de CSS/JS (Se o site pedir /static/js, ele olha na pasta static/js)
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# O segredo da Tela Branca: Servir os arquivos que o React joga na raiz
@app.get("/{file_path:path}")
async def catch_all(request: Request, file_path: str):
    # Se for API, ignora
    if file_path.startswith("api"):
        return {"detail": "Not Found"}
    
    # Tenta achar o arquivo real (ex: main.js ou logo.png)
    file_full_path = STATIC_DIR / file_path
    if file_full_path.is_file():
        return FileResponse(file_full_path)
    
    # Se não for um arquivo, entrega o index.html (pro React assumir o controle)
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    
    return {"detail": "Frontend não encontrado"}
