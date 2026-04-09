from database import db, client
from fastapi.staticfiles import StaticFiles
from auth_utils import hash_password
from models import Colaborador, CorporateDomain
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    try:
        await db.colaboradores.create_index("email", unique=True)
    except:
        pass

static_path = Path(__file__).parent / "static"

if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
    @app.get("/{catchall:path}")
    async def serve_react_app(request: Request, catchall: str):
        if catchall.startswith("api"): return {"detail": "Not Found"}
        index_file = static_path / "index.html"
        return FileResponse(index_file) if index_file.exists() else {"detail": "Frontend missing"}
