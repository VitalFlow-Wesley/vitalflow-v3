from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from dotenv import load_dotenv
from pathlib import Path

# Load env vars FIRST
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Now import everything else
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date
from emergentintegrations.llm.chat import LlmChat, UserMessage

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-change-me')

# Password Hashing Functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT Token Functions
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

# Get Current User Helper
async def get_current_colaborador(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo de token inválido")
        
        colaborador = await db.colaboradores.find_one({"id": payload["sub"]}, {"_id": 0})
        if not colaborador:
            raise HTTPException(status_code=401, detail="Colaborador não encontrado")
        
        colaborador.pop("password_hash", None)
        return colaborador
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Setor(str):
    ADMINISTRATIVO = "Administrativo"
    SAC = "SAC"
    LOGISTICA = "Logística"
    OPERACIONAL = "Operacional"

class NivelAcesso(str):
    USER = "User"
    GESTOR = "Gestor"

# Auth Models
class RegisterRequest(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(..., min_length=6)
    data_nascimento: date
    setor: str
    nivel_acesso: str = "User"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    id: str
    nome: str
    email: str
    data_nascimento: str
    foto_url: Optional[str]
    setor: str
    nivel_acesso: str

# Colaborador Models
class ColaboradorCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    data_nascimento: date
    email: EmailStr
    setor: str
    nivel_acesso: str = "User"
    foto_base64: Optional[str] = None

class ColaboradorUpdate(BaseModel):
    nome: Optional[str] = None
    data_nascimento: Optional[date] = None
    foto_base64: Optional[str] = None

class Colaborador(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    data_nascimento: str
    email: str
    password_hash: str
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

# Analysis Models (keeping existing with updates)
class BiometricInput(BaseModel):
    hrv: int = Field(..., ge=0, le=200)
    bpm: int = Field(..., ge=40, le=200)
    bpm_average: int = Field(..., ge=40, le=120)
    sleep_hours: float = Field(..., ge=0, le=24)
    cognitive_load: int = Field(..., ge=0, le=10)
    colaborador_id: Optional[str] = None
    user_name: str = Field(default="Colaborador")
    age: int = Field(default=30, ge=18, le=120)

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

# Wearable Models
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

# Dashboard Models
class DashboardMetrics(BaseModel):
    total_colaboradores: int
    total_analises: int
    media_v_score: float
    colaboradores_criticos: int
    colaboradores_atencao: int
    colaboradores_otimo: int
    analises_por_setor: dict

# Smartwatch Models
class MovementData(BaseModel):
    """Dados de movimento do smartwatch"""
    accelerometer_x: float = Field(default=0.0, description="Acelerômetro eixo X")
    accelerometer_y: float = Field(default=0.0, description="Acelerômetro eixo Y")
    accelerometer_z: float = Field(default=0.0, description="Acelerômetro eixo Z")
    gyroscope_x: float = Field(default=0.0, description="Giroscópio eixo X")
    gyroscope_y: float = Field(default=0.0, description="Giroscópio eixo Y")
    gyroscope_z: float = Field(default=0.0, description="Giroscópio eixo Z")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SmartwatchData(BaseModel):
    """Dados recebidos do smartwatch"""
    bpm: int = Field(..., ge=40, le=220, description="Frequência cardíaca (BPM)")
    hrv: int = Field(..., ge=0, le=200, description="Variabilidade da FC (HRV em ms)")
    movement_data: Optional[MovementData] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SmartwatchAnalysisResult(BaseModel):
    """Resultado da análise de dados do smartwatch"""
    anonymous_id: str = Field(..., description="ID anônimo (UUID) para LGPD")
    status: str = Field(..., description="Status detectado: Normal, Alerta de Estresse, Sinal de Fadiga")
    bpm: int
    hrv: int
    is_stationary: bool = Field(..., description="Se o usuário está parado")
    stationary_duration_minutes: Optional[float] = None
    ai_recommendation: str = Field(..., description="Recomendação de Reset de Foco da IA")
    detected_at: str
    risk_level: str = Field(..., description="Nível de risco: Baixo, Médio, Alto")

# AI Analysis Function
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
        
        return json.loads(response_text)
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
        status, tag = "Verde", "Resiliência Ótima"
    elif score >= 50:
        status, tag = "Amarelo", "Atenção Necessária"
    else:
        status, tag = "Vermelho", "Alerta Crítico"
    
    if not areas:
        areas = ["Sistema Geral"]
    
    causes, nudges = [], []
    if data.hrv < 50:
        causes.append(f"HRV baixa ({data.hrv}ms) indica estresse do sistema nervoso")
        nudges.append("Faça 5 minutos de respiração diafragmática")
    if bpm_increase > 15:
        causes.append(f"BPM {int(bpm_increase)}% acima da média")
        nudges.append("Beba 400ml de água gelada e descanse 10 minutos")
    if data.sleep_hours < 6:
        causes.append(f"Déficit de sono ({data.sleep_hours}h)")
        nudges.append("Tire um cochilo de 20 minutos")
    
    return {
        "v_score": score,
        "area_afetada": areas,
        "status_visual": status,
        "tag_rapida": tag,
        "causa_provavel": ". ".join(causes) if causes else "Parâmetros normais",
        "nudge_acao": nudges[0] if nudges else "Continue com bons hábitos"
    }

# Smartwatch Analysis Functions
def generate_anonymous_id(colaborador_id: str) -> str:
    """
    Gera UUID anônimo para LGPD
    Não permite rastreamento individual do colaborador
    """
    return str(uuid.uuid4())

def detect_stationary_state(movement_data: Optional[MovementData], previous_movements: list = None) -> tuple[bool, float]:
    """
    Detecta se o usuário está parado (acelerômetro e giroscópio próximos de zero)
    Retorna: (is_stationary, duration_in_minutes)
    """
    if not movement_data:
        return False, 0.0
    
    # Threshold para considerar "parado" (valores próximos de zero)
    STATIONARY_THRESHOLD = 0.1
    
    # Verifica se todos os sensores estão próximos de zero
    is_stationary = (
        abs(movement_data.accelerometer_x) < STATIONARY_THRESHOLD and
        abs(movement_data.accelerometer_y) < STATIONARY_THRESHOLD and
        abs(movement_data.accelerometer_z) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_x) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_y) < STATIONARY_THRESHOLD and
        abs(movement_data.gyroscope_z) < STATIONARY_THRESHOLD
    )
    
    # TODO: Em produção, calcular duração real baseado em histórico
    # Por enquanto, simula duração baseado na proximidade de zero
    simulated_duration = 0.0
    if is_stationary:
        simulated_duration = 75.0  # Simula 75 minutos parado (mock)
    
    return is_stationary, simulated_duration

async def analyze_smartwatch_data(data: SmartwatchData, colaborador_id: str) -> dict:
    """
    Analisa dados do smartwatch e detecta:
    - Alerta de Estresse (BPM > 100 e HRV baixo)
    - Sinal de Fadiga (parado por mais de 1 hora)
    - Gera recomendação de Reset de Foco via GPT-4o
    """
    try:
        # Gera ID anônimo para LGPD
        anonymous_id = generate_anonymous_id(colaborador_id)
        
        # Detecta estado estacionário
        is_stationary, stationary_duration = detect_stationary_state(data.movement_data)
        
        # Lógica de detecção
        status = "Normal"
        risk_level = "Baixo"
        
        # Alerta de Estresse: BPM > 100 e HRV baixo (<50ms)
        if data.bpm > 100 and data.hrv < 50:
            status = "Alerta de Estresse"
            risk_level = "Alto"
        # Sinal de Fadiga: parado por mais de 60 minutos
        elif is_stationary and stationary_duration > 60:
            status = "Sinal de Fadiga"
            risk_level = "Médio"
        # Combinação crítica: estresse + fadiga
        elif data.bpm > 100 and data.hrv < 50 and is_stationary:
            status = "Alerta Crítico: Estresse + Fadiga"
            risk_level = "Alto"
        
        # Chama GPT-4o para recomendação de Reset de Foco
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"smartwatch-{anonymous_id}",
            system_message="""
Você é um coach de performance e bem-estar corporativo especializado em biohacking.
Sua função é fornecer recomendações práticas de "Reset de Foco" para colaboradores.

DIRETRIZES:
- Recomendações devem ser executáveis em 5-10 minutos
- Foco em técnicas de respiração, movimento ou mindfulness
- Linguagem direta e motivadora
- Considere o contexto de trabalho corporativo
- Priorize ações que podem ser feitas no escritório

FORMATO DA RESPOSTA:
Título: [Nome da técnica]
Ação: [Passo a passo em 2-3 frases]
Benefício: [Resultado esperado em 1 frase]
"""
        ).with_model("openai", "gpt-4o")
        
        # Monta contexto para a IA
        context = f"""
DADOS DO COLABORADOR (ANONIMIZADO):
- Status Detectado: {status}
- BPM: {data.bpm} (Normal: 60-100)
- HRV: {data.hrv}ms (Ideal: >50ms)
- Movimento: {"Parado há " + str(int(stationary_duration)) + " minutos" if is_stationary else "Em movimento"}
- Nível de Risco: {risk_level}

Forneça uma recomendação de Reset de Foco apropriada para este cenário.
"""
        
        user_message = UserMessage(text=context)
        ai_response = await chat.send_message(user_message)
        
        return {
            "anonymous_id": anonymous_id,
            "status": status,
            "bpm": data.bpm,
            "hrv": data.hrv,
            "is_stationary": is_stationary,
            "stationary_duration_minutes": stationary_duration if is_stationary else None,
            "ai_recommendation": ai_response.strip(),
            "detected_at": data.timestamp.isoformat(),
            "risk_level": risk_level
        }
        
    except Exception as e:
        logger.error(f"Error analyzing smartwatch data: {str(e)}")
        # Fallback sem IA
        return {
            "anonymous_id": generate_anonymous_id(colaborador_id),
            "status": status,
            "bpm": data.bpm,
            "hrv": data.hrv,
            "is_stationary": is_stationary,
            "stationary_duration_minutes": stationary_duration if is_stationary else None,
            "ai_recommendation": "Faça uma pausa de 5 minutos: levante-se, caminhe e respire profundamente 5 vezes.",
            "detected_at": data.timestamp.isoformat(),
            "risk_level": risk_level
        }


# AUTH ENDPOINTS
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(data: RegisterRequest, response: Response):
    try:
        email_lower = data.email.lower()
        existing = await db.colaboradores.find_one({"email": email_lower}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        colaborador = Colaborador(
            nome=data.nome,
            email=email_lower,
            password_hash=hash_password(data.password),
            data_nascimento=data.data_nascimento.isoformat(),
            setor=data.setor,
            nivel_acesso=data.nivel_acesso
        )
        
        doc = colaborador.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.colaboradores.insert_one(doc)
        
        # Create tokens
        access_token = create_access_token(colaborador.id, colaborador.email)
        refresh_token = create_refresh_token(colaborador.id)
        
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=604800,
            path="/"
        )
        
        return AuthResponse(
            id=colaborador.id,
            nome=colaborador.nome,
            email=colaborador.email,
            data_nascimento=colaborador.data_nascimento,
            foto_url=colaborador.foto_url,
            setor=colaborador.setor,
            nivel_acesso=colaborador.nivel_acesso
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in register: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(data: LoginRequest, response: Response, request: Request):
    try:
        email_lower = data.email.lower()
        colaborador = await db.colaboradores.find_one({"email": email_lower}, {"_id": 0})
        
        if not colaborador or not verify_password(data.password, colaborador["password_hash"]):
            raise HTTPException(status_code=401, detail="Email ou senha incorretos")
        
        # Create tokens
        access_token = create_access_token(colaborador["id"], colaborador["email"])
        refresh_token = create_refresh_token(colaborador["id"])
        
        # Set cookies
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=604800,
            path="/"
        )
        
        return AuthResponse(
            id=colaborador["id"],
            nome=colaborador["nome"],
            email=colaborador["email"],
            data_nascimento=colaborador["data_nascimento"],
            foto_url=colaborador.get("foto_url"),
            setor=colaborador["setor"],
            nivel_acesso=colaborador["nivel_acesso"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logout realizado com sucesso"}

@api_router.get("/auth/me", response_model=AuthResponse)
async def get_me(request: Request):
    colaborador = await get_current_colaborador(request)
    return AuthResponse(
        id=colaborador["id"],
        nome=colaborador["nome"],
        email=colaborador["email"],
        data_nascimento=colaborador["data_nascimento"],
        foto_url=colaborador.get("foto_url"),
        setor=colaborador["setor"],
        nivel_acesso=colaborador["nivel_acesso"]
    )

@api_router.put("/auth/profile", response_model=AuthResponse)
async def update_profile(data: ColaboradorUpdate, request: Request):
    """Atualiza o perfil do colaborador logado"""
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
            {"$set": update_data}
        )
        
        # Get updated colaborador
        updated = await db.colaboradores.find_one({"id": colaborador["id"]}, {"_id": 0})
        
        return AuthResponse(
            id=updated["id"],
            nome=updated["nome"],
            email=updated["email"],
            data_nascimento=updated["data_nascimento"],
            foto_url=updated.get("foto_url"),
            setor=updated["setor"],
            nivel_acesso=updated["nivel_acesso"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ANALYSIS ENDPOINTS
@api_router.post("/analyze", response_model=AnalysisResponse)
async def create_analysis(input_data: BiometricInput, request: Request):
    try:
        # Get current colaborador
        colaborador = await get_current_colaborador(request)
        input_data.colaborador_id = colaborador["id"]
        
        analysis_result = await analyze_biometrics(input_data)
        
        analysis = Analysis(
            v_score=analysis_result["v_score"],
            area_afetada=analysis_result["area_afetada"],
            status_visual=analysis_result["status_visual"],
            tag_rapida=analysis_result["tag_rapida"],
            causa_provavel=analysis_result["causa_provavel"],
            nudge_acao=analysis_result["nudge_acao"],
            input_data=input_data,
            colaborador_id=colaborador["id"]
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
async def get_history(request: Request, limit: int = 30):
    try:
        colaborador = await get_current_colaborador(request)
        
        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
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

# WEARABLE ENDPOINTS
@api_router.post("/wearables/connect", response_model=WearableConnectionResponse)
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
            id=device["id"],
            provider=device["provider"],
            device_name=device["device_name"],
            is_connected=device["is_connected"],
            last_sync=device["last_sync"],
            created_at=device["created_at"]
        )
    except Exception as e:
        logger.error(f"Error connecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/wearables", response_model=List[WearableConnectionResponse])
async def get_wearables(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        devices = await db.wearable_devices.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0}
        ).to_list(100)
        
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
async def disconnect_wearable(device_id: str, request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        result = await db.wearable_devices.delete_one({
            "id": device_id,
            "colaborador_id": colaborador["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Dispositivo não encontrado")
        
        return {"status": "success", "message": "Dispositivo desconectado"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error disconnecting wearable: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# GESTOR DASHBOARD (only for gestores)
@api_router.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(request: Request):
    try:
        colaborador = await get_current_colaborador(request)
        
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")
        
        total_colaboradores = await db.colaboradores.count_documents({})
        total_analises = await db.analyses.count_documents({})
        
        pipeline_avg = [{"$group": {"_id": None, "avg_score": {"$avg": "$v_score"}}}]
        avg_result = await db.analyses.aggregate(pipeline_avg).to_list(1)
        media_v_score = avg_result[0]["avg_score"] if avg_result else 0
        
        criticos = await db.analyses.count_documents({"v_score": {"$lt": 50}})
        atencao = await db.analyses.count_documents({"v_score": {"$gte": 50, "$lt": 80}})
        otimo = await db.analyses.count_documents({"v_score": {"$gte": 80}})
        
        return DashboardMetrics(
            total_colaboradores=total_colaboradores,
            total_analises=total_analises,
            media_v_score=round(media_v_score, 1),
            colaboradores_criticos=criticos,
            colaboradores_atencao=atencao,
            colaboradores_otimo=otimo,
            analises_por_setor={}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/colaboradores", response_model=List[ColaboradorResponse])
async def get_colaboradores(request: Request, setor: Optional[str] = None):
    try:
        colaborador = await get_current_colaborador(request)
        
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")
        
        query = {}
        if setor:
            query["setor"] = setor
        
        colaboradores = await db.colaboradores.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
        
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching colaboradores: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SMARTWATCH ENDPOINTS
@api_router.post("/smartwatch/analyze", response_model=SmartwatchAnalysisResult)
async def analyze_smartwatch(data: SmartwatchData, request: Request):
    """
    Endpoint para análise de dados do smartwatch em tempo real
    Detecta: Alerta de Estresse, Sinal de Fadiga
    Retorna: Recomendação de Reset de Foco via GPT-4o
    """
    try:
        colaborador = await get_current_colaborador(request)
        
        # Analisa dados do smartwatch
        result = await analyze_smartwatch_data(data, colaborador["id"])
        
        # Salva análise no histórico (opcional - para análise posterior)
        doc = {
            "id": str(uuid.uuid4()),
            "anonymous_id": result["anonymous_id"],
            "colaborador_id": colaborador["id"],  # Mantido apenas para vínculo interno
            "type": "smartwatch_analysis",
            "status": result["status"],
            "risk_level": result["risk_level"],
            "bpm": result["bpm"],
            "hrv": result["hrv"],
            "is_stationary": result["is_stationary"],
            "stationary_duration_minutes": result["stationary_duration_minutes"],
            "ai_recommendation": result["ai_recommendation"],
            "timestamp": result["detected_at"]
        }
        
        await db.smartwatch_analyses.insert_one(doc)
        
        return SmartwatchAnalysisResult(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in smartwatch analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/smartwatch/webhook")
async def smartwatch_webhook(data: SmartwatchData, device_token: str):
    """
    Webhook para receber dados de smartwatches reais (preparado para produção)
    Aceita dados via token de autenticação do dispositivo
    """
    try:
        # TODO: Validar device_token e associar ao colaborador
        # Por enquanto, aceita dados mas não processa sem autenticação
        
        logger.info(f"Smartwatch webhook received: BPM={data.bpm}, HRV={data.hrv}")
        
        return {
            "status": "received",
            "message": "Dados recebidos. Webhook preparado para integração real.",
            "data_received": {
                "bpm": data.bpm,
                "hrv": data.hrv,
                "has_movement_data": data.movement_data is not None
            }
        }
        
    except Exception as e:
        logger.error(f"Error in smartwatch webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/smartwatch/history")
async def get_smartwatch_history(request: Request, limit: int = 20):
    """
    Retorna histórico de análises do smartwatch (anonimizadas)
    """
    try:
        colaborador = await get_current_colaborador(request)
        
        analyses = await db.smartwatch_analyses.find(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0, "colaborador_id": 0}  # Remove IDs sensíveis
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return analyses
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching smartwatch history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Root
@api_router.get("/")
async def root():
    return {"message": "VitalFlow API - Copiloto Corporativo de Longevidade"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get('FRONTEND_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup: Create indexes and seed admin
@app.on_event("startup")
async def startup_event():
    try:
        await db.colaboradores.create_index("email", unique=True)
        logger.info("Database indexes created")
        
        # Seed admin
        admin_email = os.environ.get('ADMIN_EMAIL', 'admin@vitalflow.com').lower()
        admin_password = os.environ.get('ADMIN_PASSWORD', 'Admin123!@#')
        
        existing_admin = await db.colaboradores.find_one({"email": admin_email}, {"_id": 0})
        
        if not existing_admin:
            admin = Colaborador(
                nome="Administrador",
                email=admin_email,
                password_hash=hash_password(admin_password),
                data_nascimento="1990-01-01",
                setor="Administrativo",
                nivel_acesso="Gestor"
            )
            doc = admin.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            await db.colaboradores.insert_one(doc)
            logger.info(f"Admin seeded: {admin_email}")
        
        # Write test credentials
        Path("/app/memory").mkdir(exist_ok=True)
        with open("/app/memory/test_credentials.md", "w") as f:
            f.write(f"""# VitalFlow - Credenciais de Teste

## Admin/Gestor
- Email: {admin_email}
- Senha: {admin_password}
- Nível: Gestor
- Setor: Administrativo

## Endpoints de Autenticação
- POST /api/auth/register - Cadastro
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Dados do colaborador logado
- PUT /api/auth/profile - Atualizar perfil

## Endpoints Protegidos
- POST /api/analyze - Criar análise
- GET /api/history - Histórico de análises
- GET /api/wearables - Dispositivos conectados
- GET /api/dashboard/metrics - Métricas (apenas gestores)
- GET /api/colaboradores - Listar colaboradores (apenas gestores)

## Endpoints Smartwatch (NOVO)
- POST /api/smartwatch/analyze - Análise em tempo real com IA
- POST /api/smartwatch/webhook - Webhook para dados reais
- GET /api/smartwatch/history - Histórico de alertas
""")
        logger.info("Test credentials written to /app/memory/test_credentials.md")
        
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()