from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class Setor(str):
    ADMINISTRATIVO = "Administrativo"
    SAC = "SAC"
    LOGISTICA = "Logística"
    OPERACIONAL = "Operacional"

class NivelAcesso(str):
    USER = "User"
    GESTOR = "Gestor"

# Colaborador Models
class ColaboradorCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    data_nascimento: date
    email: EmailStr
    setor: str
    nivel_acesso: str = "User"
    foto_base64: Optional[str] = None

class Colaborador(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    data_nascimento: str
    email: str
    foto_url: Optional[str] = None
    setor: str
    nivel_acesso: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ColaboradorResponse(BaseModel):
    id: str
    nome: str
    data_nascimento: str
    email: str
    foto_url: Optional[str]
    setor: str
    nivel_acesso: str
    created_at: str
    updated_at: str

# Existing models (BiometricInput, Analysis, etc. remain the same)
class BiometricInput(BaseModel):
    hrv: int = Field(..., ge=0, le=200, description="Heart Rate Variability (ms)")
    bpm: int = Field(..., ge=40, le=200, description="Current BPM")
    bpm_average: int = Field(..., ge=40, le=120, description="Average resting BPM")
    sleep_hours: float = Field(..., ge=0, le=24, description="Hours of sleep")
    cognitive_load: int = Field(..., ge=0, le=10, description="Cognitive load level 0-10")
    colaborador_id: Optional[str] = None  # Link to colaborador
    user_name: str = Field(default="Colaborador", description="User name")
    age: int = Field(default=30, ge=18, le=120, description="User age")

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    v_score: int = Field(..., ge=0, le=100)
    area_afetada: List[str]
    status_visual: str
    tag_rapida: str
    causa_provavel: str
    nudge_acao: str
    input_data: BiometricInput
    colaborador_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    v_score: int
    area_afetada: List[str]
    status_visual: str
    tag_rapida: str
    causa_provavel: str
    nudge_acao: str
    timestamp: str
    colaborador_id: Optional[str] = None

# Wearable Device Models
class WearableProvider(str):
    GOOGLE_HEALTH = "google_health_connect"
    APPLE_HEALTH = "apple_healthkit"
    GARMIN = "garmin"
    FITBIT = "fitbit"

class WearableDevice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = Field(default="default_user")
    provider: str
    device_name: str
    is_connected: bool = False
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WearableConnectionRequest(BaseModel):
    provider: str
    device_name: str = "My Device"

class WearableConnectionResponse(BaseModel):
    id: str
    provider: str
    device_name: str
    is_connected: bool
    last_sync: Optional[str]
    created_at: str

class BiometricWebhookData(BaseModel):
    """Data received from wearable devices via webhook"""
    hrv: Optional[int] = None
    bpm: Optional[int] = None
    bpm_average: Optional[int] = None
    sleep_hours: Optional[float] = None
    device_id: str
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Dashboard aggregation models
class DashboardMetrics(BaseModel):
    total_colaboradores: int
    total_analises: int
    media_v_score: float
    colaboradores_criticos: int  # V-Score < 50
    colaboradores_atencao: int   # V-Score 50-79
    colaboradores_otimo: int     # V-Score >= 80
    analises_por_setor: dict

# AI Analysis Function (keeping existing)
async def analyze_biometrics(data: BiometricInput) -> dict:
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"analysis-{uuid.uuid4()}",
            system_message="""
Você é o motor de análise preditiva do VitalFlow, um copiloto de longevidade e saúde mental corporativo.
Você atua como uma fusão de um Cardiologista, Neurocientista e Coach de Performance.
Sua linguagem deve ser técnica, porém encorajadora e direta (estilo 'Biohacking').

LÓGICA DE DIAGNÓSTICO (O V-SCORE):
- HRV (Variabilidade Cardíaca): Se baixa (<50ms), indique estresse do sistema nervoso
- Batimentos (BPM): Se >15% acima da média em repouso, indique alerta cardíaco
- Carga Cognitiva: Se alta (>7) e sono <6h, indique fadiga cerebral
- Sono: <6h é déficit, <5h é crítico

V-Score Calculation:
- 80-100: Verde (Ótimo)
- 50-79: Amarelo (Atenção)
- 0-49: Vermelho (Alerta)

RESPONDA APENAS EM FORMATO JSON VÁLIDO:
{
  "v_score": <número 0-100>,
  "area_afetada": [<lista de áreas: "Cérebro", "Coração", "Músculos", "Sistema Digestivo">],
  "status_visual": "<Verde, Amarelo ou Vermelho>",
  "tag_rapida": "<tag curta, ex: 'Overload Cognitivo'>",
  "causa_provavel": "<explicação técnica curta>",
  "nudge_acao": "<ação de 5 minutos que o colaborador pode fazer agora>"
}
"""
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""
ANALISE OS DADOS BIOMÉTRICOS DO COLABORADOR:

Perfil: {data.user_name}, {data.age} anos
- HRV (Variabilidade Cardíaca): {data.hrv} ms
- BPM Atual: {data.bpm} bpm
- BPM Média em Repouso: {data.bpm_average} bpm
- Horas de Sono: {data.sleep_hours}h
- Carga Cognitiva: {data.cognitive_load}/10

Faça a análise completa e retorne APENAS o JSON com o diagnóstico.
"""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        response_text = response.strip()
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join([line for line in lines if not line.startswith('```')])
        
        analysis_data = json.loads(response_text)
        return analysis_data
        
    except Exception as e:
        logger.error(f"Error in AI analysis: {str(e)}")
        return fallback_analysis(data)

def fallback_analysis(data: BiometricInput) -> dict:
    bpm_increase = ((data.bpm - data.bpm_average) / data.bpm_average) * 100
    score = 100
    areas = []
    
    if data.hrv < 30:
        score -= 30
        areas.extend(["Cérebro", "Coração"])
    elif data.hrv < 50:
        score -= 15
        areas.append("Coração")
    
    if bpm_increase > 25:
        score -= 25
        if "Coração" not in areas:
            areas.append("Coração")
    elif bpm_increase > 15:
        score -= 15
        if "Coração" not in areas:
            areas.append("Coração")
    
    if data.sleep_hours < 5:
        score -= 20
        if "Cérebro" not in areas:
            areas.append("Cérebro")
    elif data.sleep_hours < 6:
        score -= 10
    
    if data.cognitive_load > 7 and data.sleep_hours < 6:
        score -= 15
        if "Cérebro" not in areas:
            areas.append("Cérebro")
    
    score = max(0, min(100, score))
    
    if score >= 80:
        status = "Verde"
        tag = "Resiliência Ótima"
    elif score >= 50:
        status = "Amarelo"
        tag = "Atenção Necessária"
    else:
        status = "Vermelho"
        tag = "Alerta Crítico"
    
    if not areas:
        areas = ["Sistema Geral"]
    
    causes = []
    nudges = []
    
    if data.hrv < 50:
        causes.append(f"HRV baixa ({data.hrv}ms) indica estresse do sistema nervoso")
        nudges.append("Faça 5 minutos de respiração diafragmática (4s inspirar, 7s segurar, 8s expirar)")
    
    if bpm_increase > 15:
        causes.append(f"BPM {int(bpm_increase)}% acima da média indica sobrecarga cardíaca")
        nudges.append("Beba 400ml de água gelada e descanse 10 minutos em posição reclinada")
    
    if data.sleep_hours < 6:
        causes.append(f"Déficit de sono ({data.sleep_hours}h) impede recuperação do sistema nervoso")
        nudges.append("Ative o Modo Foco e tire um cochilo de 20 minutos")
    
    causa = ". ".join(causes) if causes else "Parâmetros dentro da normalidade"
    nudge = nudges[0] if nudges else "Continue mantendo seus bons hábitos de saúde"
    
    return {
        "v_score": score,
        "area_afetada": areas,
        "status_visual": status,
        "tag_rapida": tag,
        "causa_provavel": causa,
        "nudge_acao": nudge
    }

# COLABORADOR ENDPOINTS
@api_router.post("/colaboradores", response_model=ColaboradorResponse)
async def create_colaborador(colaborador_data: ColaboradorCreate):
    """
    Cria um novo colaborador
    """
    try:
        # Check if email already exists
        existing = await db.colaboradores.find_one({"email": colaborador_data.email}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Handle photo
        foto_url = None
        if colaborador_data.foto_base64:
            # In production, upload to cloud storage
            # For now, store as data URL
            foto_url = f"data:image/jpeg;base64,{colaborador_data.foto_base64}"
        
        colaborador = Colaborador(
            nome=colaborador_data.nome,
            data_nascimento=colaborador_data.data_nascimento.isoformat(),
            email=colaborador_data.email,
            foto_url=foto_url,
            setor=colaborador_data.setor,
            nivel_acesso=colaborador_data.nivel_acesso
        )
        
        doc = colaborador.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        
        await db.colaboradores.insert_one(doc)
        
        return ColaboradorResponse(
            id=colaborador.id,
            nome=colaborador.nome,
            data_nascimento=colaborador.data_nascimento,
            email=colaborador.email,
            foto_url=colaborador.foto_url,
            setor=colaborador.setor,
            nivel_acesso=colaborador.nivel_acesso,
            created_at=colaborador.created_at.isoformat(),
            updated_at=colaborador.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating colaborador: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/colaboradores", response_model=List[ColaboradorResponse])
async def get_colaboradores(setor: Optional[str] = None):
    """
    Lista todos os colaboradores
    """
    try:
        query = {}
        if setor:
            query["setor"] = setor
        
        colaboradores = await db.colaboradores.find(query, {"_id": 0}).to_list(1000)
        
        return [
            ColaboradorResponse(
                id=c["id"],
                nome=c["nome"],
                data_nascimento=c["data_nascimento"],
                email=c["email"],
                foto_url=c.get("foto_url"),
                setor=c["setor"],
                nivel_acesso=c["nivel_acesso"],
                created_at=c["created_at"],
                updated_at=c["updated_at"]
            )
            for c in colaboradores
        ]
        
    except Exception as e:
        logger.error(f"Error fetching colaboradores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/colaboradores/{colaborador_id}", response_model=ColaboradorResponse)
async def get_colaborador(colaborador_id: str):
    """
    Retorna um colaborador específico
    """
    try:
        colaborador = await db.colaboradores.find_one({"id": colaborador_id}, {"_id": 0})
        
        if not colaborador:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        return ColaboradorResponse(
            id=colaborador["id"],
            nome=colaborador["nome"],
            data_nascimento=colaborador["data_nascimento"],
            email=colaborador["email"],
            foto_url=colaborador.get("foto_url"),
            setor=colaborador["setor"],
            nivel_acesso=colaborador["nivel_acesso"],
            created_at=colaborador["created_at"],
            updated_at=colaborador["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching colaborador: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/colaboradores/{colaborador_id}", response_model=ColaboradorResponse)
async def update_colaborador(colaborador_id: str, colaborador_data: ColaboradorCreate):
    """
    Atualiza um colaborador
    """
    try:
        existing = await db.colaboradores.find_one({"id": colaborador_id}, {"_id": 0})
        
        if not existing:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        foto_url = existing.get("foto_url")
        if colaborador_data.foto_base64:
            foto_url = f"data:image/jpeg;base64,{colaborador_data.foto_base64}"
        
        update_data = {
            "nome": colaborador_data.nome,
            "data_nascimento": colaborador_data.data_nascimento.isoformat(),
            "email": colaborador_data.email,
            "foto_url": foto_url,
            "setor": colaborador_data.setor,
            "nivel_acesso": colaborador_data.nivel_acesso,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.colaboradores.update_one(
            {"id": colaborador_id},
            {"$set": update_data}
        )
        
        return ColaboradorResponse(
            id=colaborador_id,
            nome=update_data["nome"],
            data_nascimento=update_data["data_nascimento"],
            email=update_data["email"],
            foto_url=update_data["foto_url"],
            setor=update_data["setor"],
            nivel_acesso=update_data["nivel_acesso"],
            created_at=existing["created_at"],
            updated_at=update_data["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating colaborador: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/colaboradores/{colaborador_id}")
async def delete_colaborador(colaborador_id: str):
    """
    Remove um colaborador
    """
    try:
        result = await db.colaboradores.delete_one({"id": colaborador_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Colaborador não encontrado")
        
        return {"status": "success", "message": "Colaborador removido"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting colaborador: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# DASHBOARD GESTOR
@api_router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """
    Retorna métricas agregadas para o dashboard do gestor
    """
    try:
        total_colaboradores = await db.colaboradores.count_documents({})
        total_analises = await db.analyses.count_documents({})
        
        # Calculate average V-Score
        pipeline_avg = [
            {"$group": {"_id": None, "avg_score": {"$avg": "$v_score"}}}
        ]
        avg_result = await db.analyses.aggregate(pipeline_avg).to_list(1)
        media_v_score = avg_result[0]["avg_score"] if avg_result else 0
        
        # Count by status
        criticos = await db.analyses.count_documents({"v_score": {"$lt": 50}})
        atencao = await db.analyses.count_documents({"v_score": {"$gte": 50, "$lt": 80}})
        otimo = await db.analyses.count_documents({"v_score": {"$gte": 80}})
        
        # Analyses by setor (need to join with colaboradores)
        analises_por_setor = {
            "Administrativo": 0,
            "SAC": 0,
            "Logística": 0,
            "Operacional": 0
        }
        
        return DashboardMetrics(
            total_colaboradores=total_colaboradores,
            total_analises=total_analises,
            media_v_score=round(media_v_score, 1),
            colaboradores_criticos=criticos,
            colaboradores_atencao=atencao,
            colaboradores_otimo=otimo,
            analises_por_setor=analises_por_setor
        )
        
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# EXISTING ROUTES (updated to use colaborador)
@api_router.get("/")
async def root():
    return {"message": "VitalFlow API - Copiloto Corporativo de Longevidade"}

@api_router.post("/analyze", response_model=AnalysisResponse)
async def create_analysis(input_data: BiometricInput):
    try:
        analysis_result = await analyze_biometrics(input_data)
        
        analysis = Analysis(
            v_score=analysis_result["v_score"],
            area_afetada=analysis_result["area_afetada"],
            status_visual=analysis_result["status_visual"],
            tag_rapida=analysis_result["tag_rapida"],
            causa_provavel=analysis_result["causa_provavel"],
            nudge_acao=analysis_result["nudge_acao"],
            input_data=input_data,
            colaborador_id=input_data.colaborador_id
        )
        
        doc = analysis.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['input_data'] = input_data.model_dump()
        
        await db.analyses.insert_one(doc)
        
        return AnalysisResponse(
            id=analysis.id,
            v_score=analysis.v_score,
            area_afetada=analysis.area_afetada,
            status_visual=analysis.status_visual,
            tag_rapida=analysis.tag_rapida,
            causa_provavel=analysis.causa_provavel,
            nudge_acao=analysis.nudge_acao,
            timestamp=analysis.timestamp.isoformat(),
            colaborador_id=analysis.colaborador_id
        )
        
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=List[AnalysisResponse])
async def get_history(limit: int = 10, colaborador_id: Optional[str] = None):
    try:
        query = {}
        if colaborador_id:
            query["colaborador_id"] = colaborador_id
        
        analyses = await db.analyses.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return [
            AnalysisResponse(
                id=a["id"],
                v_score=a["v_score"],
                area_afetada=a["area_afetada"],
                status_visual=a["status_visual"],
                tag_rapida=a["tag_rapida"],
                causa_provavel=a["causa_provavel"],
                nudge_acao=a["nudge_acao"],
                timestamp=a["timestamp"],
                colaborador_id=a.get("colaborador_id")
            )
            for a in analyses
        ]
        
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    try:
        analysis = await db.analyses.find_one({"id": analysis_id}, {"_id": 0})
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Análise não encontrada")
        
        return AnalysisResponse(
            id=analysis["id"],
            v_score=analysis["v_score"],
            area_afetada=analysis["area_afetada"],
            status_visual=analysis["status_visual"],
            tag_rapida=analysis["tag_rapida"],
            causa_provavel=analysis["causa_provavel"],
            nudge_acao=analysis["nudge_acao"],
            timestamp=analysis["timestamp"],
            colaborador_id=analysis.get("colaborador_id")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Wearable Device Endpoints (keeping existing)
@api_router.post("/wearables/connect", response_model=WearableConnectionResponse)
async def connect_wearable(request: WearableConnectionRequest):
    try:
        device = WearableDevice(
            provider=request.provider,
            device_name=request.device_name,
            is_connected=True,
            last_sync=datetime.now(timezone.utc)
        )
        
        doc = device.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['last_sync'] = doc['last_sync'].isoformat() if doc['last_sync'] else None
        
        await db.wearable_devices.insert_one(doc)
        
        return WearableConnectionResponse(
            id=device.id,
            provider=device.provider,
            device_name=device.device_name,
            is_connected=device.is_connected,
            last_sync=device.last_sync.isoformat() if device.last_sync else None,
            created_at=device.created_at.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error connecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wearables", response_model=List[WearableConnectionResponse])
async def get_wearables():
    try:
        devices = await db.wearable_devices.find({}, {"_id": 0}).to_list(100)
        
        return [
            WearableConnectionResponse(
                id=d["id"],
                provider=d["provider"],
                device_name=d["device_name"],
                is_connected=d["is_connected"],
                last_sync=d.get("last_sync"),
                created_at=d["created_at"]
            )
            for d in devices
        ]
        
    except Exception as e:
        logger.error(f"Error fetching wearables: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/wearables/{device_id}")
async def disconnect_wearable(device_id: str):
    try:
        result = await db.wearable_devices.delete_one({"id": device_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        return {"status": "success", "message": "Dispositivo desconectado"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/wearables/webhook/{device_id}")
async def receive_wearable_data(device_id: str, data: BiometricWebhookData):
    try:
        device = await db.wearable_devices.find_one({"id": device_id}, {"_id": 0})
        
        if not device:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        await db.wearable_devices.update_one(
            {"id": device_id},
            {"$set": {"last_sync": datetime.now(timezone.utc).isoformat()}}
        )
        
        if data.hrv and data.bpm and data.bpm_average and data.sleep_hours:
            biometric_input = BiometricInput(
                hrv=data.hrv,
                bpm=data.bpm,
                bpm_average=data.bpm_average,
                sleep_hours=data.sleep_hours,
                cognitive_load=5,
                user_name="Colaborador",
                age=30
            )
            
            analysis_result = await analyze_biometrics(biometric_input)
            
            analysis = Analysis(
                v_score=analysis_result["v_score"],
                area_afetada=analysis_result["area_afetada"],
                status_visual=analysis_result["status_visual"],
                tag_rapida=analysis_result["tag_rapida"],
                causa_provavel=analysis_result["causa_provavel"],
                nudge_acao=analysis_result["nudge_acao"],
                input_data=biometric_input
            )
            
            doc = analysis.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            doc['input_data'] = biometric_input.model_dump()
            doc['auto_generated'] = True
            doc['source_device'] = device_id
            
            await db.analyses.insert_one(doc)
            
            return {
                "status": "success",
                "message": "Dados recebidos e análise gerada automaticamente",
                "analysis_id": analysis.id
            }
        
        return {
            "status": "success",
            "message": "Dados recebidos parcialmente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error receiving wearable data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wearables/{device_id}/latest-data")
async def get_latest_wearable_data(device_id: str):
    try:
        analysis = await db.analyses.find_one(
            {"source_device": device_id},
            {"_id": 0}
        )
        
        if not analysis:
            return {"status": "no_data", "message": "Nenhum dado disponível"}
        
        return AnalysisResponse(
            id=analysis["id"],
            v_score=analysis["v_score"],
            area_afetada=analysis["area_afetada"],
            status_visual=analysis["status_visual"],
            tag_rapida=analysis["tag_rapida"],
            causa_provavel=analysis["causa_provavel"],
            nudge_acao=analysis["nudge_acao"],
            timestamp=analysis["timestamp"],
            colaborador_id=analysis.get("colaborador_id")
        )
        
    except Exception as e:
        logger.error(f"Error fetching latest wearable data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()