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
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    account_type: str = "personal"
    domain: Optional[str] = None
    company_name: Optional[str] = None
    is_premium: bool = False
    energy_points: int = 0
    current_streak: int = 0

# Colaborador Models
class ColaboradorCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    data_nascimento: date
    email: EmailStr
    setor: str
    nivel_acesso: str = "User"
    foto_base64: Optional[str] = None
    # Campos corporativos (apenas para domínios empresariais)
    matricula: Optional[str] = None
    cargo: Optional[str] = None

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
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    account_type: str = Field(default="personal")  # "personal" ou "corporate"
    domain: Optional[str] = None
    is_premium: bool = False
    energy_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_nudge_date: Optional[str] = None
    badges: List[dict] = Field(default_factory=list)
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
    matricula: Optional[str]
    cargo: Optional[str]
    account_type: str
    domain: Optional[str]
    created_at: str
    updated_at: str

# Domain Models
class CorporateDomain(BaseModel):
    """Domínios corporativos cadastrados"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    domain: str = Field(..., description="Ex: brisanet.com.br")
    company_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DomainCheckResponse(BaseModel):
    is_corporate: bool
    domain: Optional[str]
    company_name: Optional[str]
    account_type: str  # "personal" ou "corporate"

# Predictive Alert Models
class PredictiveAlert(BaseModel):
    """Alerta preditivo baseado em histórico"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    colaborador_id: str
    predicted_stress_time: str
    current_time: str
    minutes_until_stress: int
    confidence: float = Field(..., ge=0, le=100)
    ai_message: str
    pattern_detected: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    input_data: Optional[dict] = None

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
    push_notification_sent: bool = Field(default=False, description="Se notificação push foi enviada")

class EnergyStatus(BaseModel):
    """Status de energia do colaborador em tempo real"""
    status: str = Field(..., description="Verde, Amarelo ou Vermelho")
    color_code: str = Field(..., description="Código hex da cor")
    label: str = Field(..., description="Label descritivo do status")
    last_updated: str
    current_bpm: Optional[int] = None
    current_hrv: Optional[int] = None

class TeamStressMetrics(BaseModel):
    """Métricas de estresse do time (anonimizadas)"""
    period: str = Field(default="últimas 24h")
    total_analyses: int
    average_stress_level: float = Field(..., ge=0, le=100, description="0-100, onde 100 é estresse máximo")
    critical_alerts: int
    medium_alerts: int
    normal_status: int
    stress_distribution: List[dict] = Field(..., description="Distribuição sem identificação")
    peak_stress_time: Optional[str] = None

# Gamification Models
class FollowNudgeRequest(BaseModel):
    analysis_id: str

class GamificationStatsResponse(BaseModel):
    energy_points: int
    current_streak: int
    longest_streak: int
    badges: List[dict]
    nudges_followed_today: int = 0
    next_badge_in: int = 0

class PlanInfoResponse(BaseModel):
    plan: str
    is_premium: bool
    account_type: str
    limits: dict

# Health Trend / Lei 14.831
class HealthTrendResponse(BaseModel):
    trend: str  # "rising", "stable", "falling"
    v_scores_7d: List[dict]
    avg_7d: float
    requires_intervention: bool  # Lei 14.831
    intervention_message: Optional[str] = None

# Team Overview (Gestor)
class TeamOverviewResponse(BaseModel):
    total_colaboradores: int
    avg_v_score: float
    avg_stress_level: float
    distribution: dict
    trend_7d: List[dict]
    lei_14831_alerts: int
    engagement_rate: float

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
        
        result = {
            "anonymous_id": anonymous_id,
            "status": status,
            "bpm": data.bpm,
            "hrv": data.hrv,
            "is_stationary": is_stationary,
            "stationary_duration_minutes": stationary_duration if is_stationary else None,
            "ai_recommendation": ai_response.strip(),
            "detected_at": data.timestamp.isoformat(),
            "risk_level": risk_level,
            "push_notification_sent": False
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing smartwatch data: {str(e)}")
        # Fallback sem IA
        return {
            "anonymous_id": generate_anonymous_id(colaborador_id),
            "status": status if 'status' in locals() else "Normal",
            "bpm": data.bpm,
            "hrv": data.hrv,
            "is_stationary": is_stationary if 'is_stationary' in locals() else False,
            "stationary_duration_minutes": stationary_duration if 'stationary_duration' in locals() else None,
            "ai_recommendation": "Faça uma pausa de 5 minutos: levante-se, caminhe e respire profundamente 5 vezes.",
            "detected_at": data.timestamp.isoformat(),
            "risk_level": "Baixo",
            "push_notification_sent": False
        }


# Domain Functions
async def check_corporate_domain(email: str) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Verifica se o email pertence a um domínio corporativo cadastrado
    Retorna: (is_corporate, domain, company_name)
    """
    try:
        domain = email.split('@')[1].lower()
        
        # Busca domínio no banco
        corporate = await db.corporate_domains.find_one(
            {"domain": domain, "is_active": True},
            {"_id": 0}
        )
        
        if corporate:
            return True, domain, corporate["company_name"]
        
        return False, domain, None
        
    except Exception as e:
        logger.error(f"Error checking domain: {str(e)}")
        return False, None, None

# Predictive AI Functions
async def analyze_stress_patterns(colaborador_id: str) -> Optional[dict]:
    """
    Analisa padrões de estresse do colaborador e prevê próximo pico
    Retorna alerta preventivo 30 minutos antes do pico esperado
    """
    try:
        # Busca histórico dos últimos 7 dias
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        
        analyses = await db.smartwatch_analyses.find(
            {
                "colaborador_id": colaborador_id,
                "timestamp": {"$gte": seven_days_ago.isoformat()}
            },
            {"_id": 0}
        ).to_list(1000)
        
        if len(analyses) < 5:  # Precisa de pelo menos 5 análises
            return None
        
        # Agrupa por hora do dia
        hour_stress = {}
        for a in analyses:
            timestamp = datetime.fromisoformat(a["timestamp"])
            hour = timestamp.hour
            weekday = timestamp.weekday()  # 0=Monday, 6=Sunday
            
            key = f"{weekday}_{hour}"  # Ex: "0_14" = Segunda 14h
            
            if key not in hour_stress:
                hour_stress[key] = []
            
            # Mapeia risk_level para score
            if a.get("risk_level") == "Alto":
                hour_stress[key].append(100)
            elif a.get("risk_level") == "Médio":
                hour_stress[key].append(60)
            else:
                hour_stress[key].append(20)
        
        # Identifica padrões: horários com alta frequência de estresse
        patterns = []
        for key, scores in hour_stress.items():
            if len(scores) >= 2:  # Pelo menos 2 ocorrências
                avg_stress = sum(scores) / len(scores)
                if avg_stress >= 70:  # Alta ou média-alta
                    weekday, hour = key.split('_')
                    patterns.append({
                        "weekday": int(weekday),
                        "hour": int(hour),
                        "avg_stress": avg_stress,
                        "occurrences": len(scores)
                    })
        
        if not patterns:
            return None
        
        # Ordena por nível de estresse
        patterns.sort(key=lambda x: x["avg_stress"], reverse=True)
        
        # Verifica se há um padrão próximo (nas próximas 2 horas)
        now = datetime.now(timezone.utc)
        current_weekday = now.weekday()
        current_hour = now.hour
        
        for pattern in patterns:
            if pattern["weekday"] == current_weekday:
                hours_until = pattern["hour"] - current_hour
                
                # Se o pico está entre 30min e 2h no futuro
                if 0.5 <= hours_until <= 2:
                    minutes_until = int(hours_until * 60)
                    
                    # Chama GPT-4o para gerar mensagem personalizada
                    chat = LlmChat(
                        api_key=os.environ['EMERGENT_LLM_KEY'],
                        session_id=f"predictive-{colaborador_id}",
                        system_message="""
Você é um coach de bem-estar preventivo. Sua função é alertar colaboradores ANTES de picos de estresse acontecerem.

DIRETRIZES:
- Tom amigável e encorajador
- Mensagem curta (2-3 frases)
- Incluir ação específica para prevenir o estresse
- Validar o histórico do colaborador
- Usar "você" diretamente

FORMATO:
[Nome], baseado no seu histórico, [padrão detectado]. [Sugestão preventiva].
"""
                    ).with_model("openai", "gpt-4o")
                    
                    # Busca nome do colaborador
                    colaborador = await db.colaboradores.find_one(
                        {"id": colaborador_id},
                        {"_id": 0, "nome": 1}
                    )
                    
                    nome = colaborador.get("nome", "Colaborador").split()[0] if colaborador else "Colaborador"
                    
                    weekday_names = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
                    
                    context = f"""
DADOS DO PADRÃO:
- Colaborador: {nome}
- Padrão detectado: Picos de estresse toda {weekday_names[pattern["weekday"]]}-feira às {pattern["hour"]}h
- Nível médio de estresse: {pattern["avg_stress"]:.0f}/100
- Ocorrências: {pattern["occurrences"]}x nos últimos 7 dias
- Tempo até o próximo pico: {minutes_until} minutos

Gere um alerta preventivo personalizado.
"""
                    
                    user_message = UserMessage(text=context)
                    ai_response = await chat.send_message(user_message)
                    
                    confidence = min(100, (pattern["occurrences"] / 7) * 100)  # Confiança baseada em frequência
                    
                    return {
                        "predicted_stress_time": f"{pattern['hour']:02d}:00",
                        "current_time": now.strftime("%H:%M"),
                        "minutes_until_stress": minutes_until,
                        "confidence": round(confidence, 1),
                        "ai_message": ai_response.strip(),
                        "pattern_detected": f"Pico de estresse detectado às {weekday_names[pattern['weekday']]}-feiras às {pattern['hour']}h ({pattern['occurrences']}x em 7 dias)"
                    }
        
        return None
        
    except Exception as e:
        logger.error(f"Error analyzing stress patterns: {str(e)}")
        return None


async def send_push_notification(colaborador: dict, status: str, recommendation: str) -> bool:
    """
    Simula envio de notificação push quando alerta crítico é detectado
    Em produção: integrar com Firebase Cloud Messaging, OneSignal, etc.
    """
    try:
        notification_payload = {
            "title": f"🚨 {status}",
            "body": recommendation[:100] + "..." if len(recommendation) > 100 else recommendation,
            "priority": "high" if "Crítico" in status else "normal",
            "sound": "default",
            "badge": 1,
            "data": {
                "type": "health_alert",
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Simula envio (em produção, chamaria API de push notification)
        logger.info(f"📱 PUSH NOTIFICATION SIMULADA para {colaborador.get('nome', 'Colaborador')}")
        logger.info(f"   Título: {notification_payload['title']}")
        logger.info(f"   Mensagem: {notification_payload['body']}")
        logger.info(f"   Prioridade: {notification_payload['priority']}")
        
        # Salva notificação no banco (histórico)
        notification_doc = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colaborador["id"],
            "type": "push_notification",
            "status": status,
            "message": recommendation,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "delivered": True  # Mock - assume entrega bem-sucedida
        }
        
        await db.notifications.insert_one(notification_doc)
        
        return True
        
    except Exception as e:
        logger.error(f"Error sending push notification: {str(e)}")
        return False

        
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
            "risk_level": risk_level,
            "push_notification_sent": False
        }


# AUTH ENDPOINTS
@api_router.get("/auth/check-domain")
async def check_domain(email: str):
    """
    Verifica se email pertence a domínio corporativo
    """
    try:
        is_corporate, domain, company_name = await check_corporate_domain(email)
        
        return DomainCheckResponse(
            is_corporate=is_corporate,
            domain=domain,
            company_name=company_name,
            account_type="corporate" if is_corporate else "personal"
        )
    except Exception as e:
        logger.error(f"Error checking domain: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# AUTH ENDPOINTS (register, login, etc.)
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(data: RegisterRequest, response: Response):
    try:
        email_lower = data.email.lower()
        existing = await db.colaboradores.find_one({"email": email_lower}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Verifica se é domínio corporativo
        is_corporate, domain, company_name = await check_corporate_domain(email_lower)
        account_type = "corporate" if is_corporate else "personal"
        
        colaborador = Colaborador(
            nome=data.nome,
            email=email_lower,
            password_hash=hash_password(data.password),
            data_nascimento=data.data_nascimento.isoformat(),
            setor=data.setor,
            nivel_acesso=data.nivel_acesso,
            account_type=account_type,
            domain=domain
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
            nivel_acesso=colaborador.nivel_acesso,
            matricula=colaborador.matricula,
            cargo=colaborador.cargo,
            account_type=colaborador.account_type,
            domain=colaborador.domain,
            company_name=company_name if is_corporate else None,
            is_premium=False,
            energy_points=0,
            current_streak=0
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
        
        # Get company_name for corporate users
        company_name = None
        if colaborador.get("account_type") == "corporate" and colaborador.get("domain"):
            corp = await db.corporate_domains.find_one(
                {"domain": colaborador["domain"]}, {"_id": 0, "company_name": 1}
            )
            if corp:
                company_name = corp["company_name"]
        
        return AuthResponse(
            id=colaborador["id"],
            nome=colaborador["nome"],
            email=colaborador["email"],
            data_nascimento=colaborador["data_nascimento"],
            foto_url=colaborador.get("foto_url"),
            setor=colaborador["setor"],
            nivel_acesso=colaborador["nivel_acesso"],
            matricula=colaborador.get("matricula"),
            cargo=colaborador.get("cargo"),
            account_type=colaborador.get("account_type", "personal"),
            domain=colaborador.get("domain"),
            company_name=company_name,
            is_premium=colaborador.get("is_premium", False),
            energy_points=colaborador.get("energy_points", 0),
            current_streak=colaborador.get("current_streak", 0)
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
    # Get company_name for corporate users
    company_name = None
    if colaborador.get("account_type") == "corporate" and colaborador.get("domain"):
        corp = await db.corporate_domains.find_one(
            {"domain": colaborador["domain"]}, {"_id": 0, "company_name": 1}
        )
        if corp:
            company_name = corp["company_name"]
    return AuthResponse(
        id=colaborador["id"],
        nome=colaborador["nome"],
        email=colaborador["email"],
        data_nascimento=colaborador["data_nascimento"],
        foto_url=colaborador.get("foto_url"),
        setor=colaborador["setor"],
        nivel_acesso=colaborador["nivel_acesso"],
        matricula=colaborador.get("matricula"),
        cargo=colaborador.get("cargo"),
        account_type=colaborador.get("account_type", "personal"),
        domain=colaborador.get("domain"),
        company_name=company_name,
        is_premium=colaborador.get("is_premium", False),
        energy_points=colaborador.get("energy_points", 0),
        current_streak=colaborador.get("current_streak", 0)
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
            colaborador_id=analysis.colaborador_id,
            input_data=input_data.model_dump()
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
                colaborador_id=a.get("colaborador_id"),
                input_data=a.get("input_data")
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


# PREDICTIVE AI ENDPOINTS
@api_router.get("/predictive/alert")
async def get_predictive_alert(request: Request):
    """
    Retorna alerta preditivo se houver padrão de estresse detectado
    IA analisa histórico e prevê próximo pico com 30min de antecedência
    TRAVA: Usuários B2C Free não têm acesso a predições
    """
    try:
        colaborador = await get_current_colaborador(request)
        
        # Verifica trava Premium para B2C
        account_type = colaborador.get("account_type", "personal")
        is_premium = colaborador.get("is_premium", False)
        if account_type == "personal" and not is_premium:
            return {
                "has_alert": False,
                "locked": True,
                "message": "Recurso exclusivo do plano Premium. Faça upgrade para acessar predições de IA."
            }
        
        # Analisa padrões de estresse
        alert_data = await analyze_stress_patterns(colaborador["id"])
        
        if not alert_data:
            return {"has_alert": False, "message": "Nenhum padrão detectado ainda"}
        
        # Salva alerta no banco
        alert = PredictiveAlert(
            colaborador_id=colaborador["id"],
            predicted_stress_time=alert_data["predicted_stress_time"],
            current_time=alert_data["current_time"],
            minutes_until_stress=alert_data["minutes_until_stress"],
            confidence=alert_data["confidence"],
            ai_message=alert_data["ai_message"],
            pattern_detected=alert_data["pattern_detected"]
        )
        
        doc = alert.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.predictive_alerts.insert_one(doc)
        
        return {
            "has_alert": True,
            "alert": {
                "message": alert_data["ai_message"],
                "predicted_time": alert_data["predicted_stress_time"],
                "minutes_until": alert_data["minutes_until_stress"],
                "confidence": alert_data["confidence"],
                "pattern": alert_data["pattern_detected"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting predictive alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/dashboard/add-employee")
async def add_employee(request: Request):
    """Gestor cadastra novo funcionário na plataforma."""
    try:
        gestor = await get_current_colaborador(request)
        if gestor["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        body = await request.json()
        nome = body.get("nome", "").strip()
        email = body.get("email", "").strip().lower()
        setor = body.get("setor", "Operacional")
        cargo = body.get("cargo", "")

        if not nome or not email:
            raise HTTPException(status_code=400, detail="Nome e email sao obrigatorios.")

        existing = await db.colaboradores.find_one({"email": email}, {"_id": 0, "id": 1})
        if existing:
            raise HTTPException(status_code=400, detail="Email ja cadastrado.")

        # Detecta domínio corporativo
        domain = email.split("@")[1] if "@" in email else None
        corp = await db.corporate_domains.find_one({"domain": domain}, {"_id": 0}) if domain else None
        account_type = "corporate" if corp else "personal"

        # Senha temporária
        temp_password = f"Temp{uuid.uuid4().hex[:6]}!"
        new_colab = Colaborador(
            nome=nome, email=email, password_hash=hash_password(temp_password),
            data_nascimento="2000-01-01", setor=setor, nivel_acesso="User",
            cargo=cargo, account_type=account_type, domain=domain
        )
        doc = new_colab.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.colaboradores.insert_one(doc)

        return {
            "id": new_colab.id, "nome": nome, "email": email,
            "setor": setor, "cargo": cargo, "account_type": account_type,
            "temp_password": temp_password,
            "message": f"Funcionario {nome} cadastrado com sucesso."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding employee: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dashboard/export-pdf")
async def export_dashboard_pdf(request: Request, period: str = "7d"):
    """
    Exporta relatório PDF real com indicadores de saúde mental e risco de burnout.
    period: 7d, 30d, 6m
    """
    try:
        colaborador = await get_current_colaborador(request)
        
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")
        
        # Calcula período
        now = datetime.now(timezone.utc)
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = now - timedelta(days=days)
        period_label = {"7d": "7 dias", "30d": "30 dias", "6m": "6 meses"}.get(period, "7 dias")
        
        # Busca análises do período
        analyses = await db.analyses.find(
            {"timestamp": {"$gte": period_start.isoformat()}},
            {"_id": 0, "v_score": 1, "status_visual": 1, "timestamp": 1, "area_afetada": 1, "colaborador_id": 1}
        ).to_list(10000)
        
        # Métricas agregadas
        total = len(analyses)
        all_scores = [a["v_score"] for a in analyses]
        avg_v = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0
        verde = sum(1 for a in analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in analyses if a["v_score"] < 50)
        
        # Colaboradores únicos com risco
        colab_scores = {}
        for a in analyses:
            cid = a.get("colaborador_id", "unknown")
            colab_scores.setdefault(cid, []).append(a["v_score"])
        burnout_risk = sum(1 for s in colab_scores.values() if sum(s)/len(s) < 50)
        total_colabs = len(colab_scores)
        
        # Áreas mais afetadas
        area_count = {}
        for a in analyses:
            for area in a.get("area_afetada", []):
                area_count[area] = area_count.get(area, 0) + 1
        top_areas = sorted(area_count.items(), key=lambda x: x[1], reverse=True)[:4]
        
        # Gera PDF com reportlab
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.colors import HexColor
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        import io
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=25*mm, bottomMargin=20*mm, leftMargin=20*mm, rightMargin=20*mm)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=22, textColor=HexColor('#111111'), spaceAfter=5*mm)
        subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=11, textColor=HexColor('#666666'), spaceAfter=8*mm)
        h2_style = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#222222'), spaceBefore=6*mm, spaceAfter=3*mm)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, textColor=HexColor('#333333'), spaceAfter=2*mm)
        
        elements = []
        
        # Header
        elements.append(Paragraph("VitalFlow - Relatorio de Saude Mental", title_style))
        elements.append(Paragraph(f"Periodo: Ultimos {period_label} | Gerado em {now.strftime('%d/%m/%Y as %H:%M')} | Por: {colaborador['nome']}", subtitle_style))
        
        # Resumo executivo
        elements.append(Paragraph("Resumo Executivo", h2_style))
        elements.append(Paragraph(f"Total de analises no periodo: {total}", body_style))
        elements.append(Paragraph(f"V-Score medio da equipe: {avg_v}/100", body_style))
        elements.append(Paragraph(f"Colaboradores ativos: {total_colabs}", body_style))
        risk_pct = round((burnout_risk / total_colabs) * 100, 1) if total_colabs > 0 else 0
        elements.append(Paragraph(f"Colaboradores em risco de burnout: {burnout_risk} ({risk_pct}%)", body_style))
        elements.append(Spacer(1, 5*mm))
        
        # Distribuição
        elements.append(Paragraph("Distribuicao de Status", h2_style))
        dist_data = [
            ["Status", "Quantidade", "Percentual"],
            ["Verde (V-Score >= 80)", str(verde), f"{round(verde/total*100,1)}%" if total else "0%"],
            ["Amarelo (V-Score 50-79)", str(amarelo), f"{round(amarelo/total*100,1)}%" if total else "0%"],
            ["Vermelho (V-Score < 50)", str(vermelho), f"{round(vermelho/total*100,1)}%" if total else "0%"],
        ]
        dist_table = Table(dist_data, colWidths=[200, 100, 100])
        dist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
            ('BACKGROUND', (0, 1), (-1, 1), HexColor('#d1fae5')),
            ('BACKGROUND', (0, 2), (-1, 2), HexColor('#fef3c7')),
            ('BACKGROUND', (0, 3), (-1, 3), HexColor('#ffe4e6')),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(dist_table)
        elements.append(Spacer(1, 5*mm))
        
        # Áreas afetadas
        if top_areas:
            elements.append(Paragraph("Areas Mais Afetadas", h2_style))
            area_data = [["Area", "Ocorrencias"]] + [[a[0], str(a[1])] for a in top_areas]
            area_table = Table(area_data, colWidths=[250, 100])
            area_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1a1a2e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#dddddd')),
                ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(area_table)
            elements.append(Spacer(1, 5*mm))
        
        # Lei 14.831
        elements.append(Paragraph("Conformidade Lei 14.831/2024 (Saude Mental no Trabalho)", h2_style))
        if burnout_risk > 0:
            elements.append(Paragraph(f"ATENCAO: {burnout_risk} colaborador(es) com V-Score medio abaixo de 50 no periodo. A legislacao exige intervencao preventiva.", body_style))
        else:
            elements.append(Paragraph("Nenhum colaborador em risco critico no periodo analisado. Empresa em conformidade.", body_style))
        
        elements.append(Spacer(1, 10*mm))
        elements.append(Paragraph("Dados 100% anonimizados conforme LGPD. Nenhum colaborador individual e identificado neste relatorio.", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=HexColor('#999999'))))
        
        doc.build(elements)
        buffer.seek(0)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=vitalflow_relatorio_{period}_{now.strftime('%Y%m%d')}.pdf"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SMARTWATCH ENDPOINTS
@api_router.get("/status/energy", response_model=EnergyStatus)
async def get_energy_status(request: Request):
    """
    Retorna o status de energia do colaborador em tempo real
    Para alimentar a bolinha visual (Verde/Amarelo/Vermelho)
    """
    try:
        colaborador = await get_current_colaborador(request)
        
        # Busca última análise do smartwatch
        last_analysis = await db.smartwatch_analyses.find_one(
            {"colaborador_id": colaborador["id"]},
            {"_id": 0}
        )
        
        if not last_analysis:
            # Sem análises ainda - status padrão
            return EnergyStatus(
                status="Verde",
                color_code="#34d399",
                label="Normal - Sem dados recentes",
                last_updated=datetime.now(timezone.utc).isoformat()
            )
        
        # Mapeia status para cor
        status_map = {
            "Normal": {
                "status": "Verde",
                "color_code": "#34d399",  # emerald-400
                "label": "Energia Normal"
            },
            "Sinal de Fadiga": {
                "status": "Amarelo",
                "color_code": "#fbbf24",  # amber-400
                "label": "Atenção - Fadiga Detectada"
            },
            "Alerta de Estresse": {
                "status": "Vermelho",
                "color_code": "#f43f5e",  # rose-500
                "label": "Crítico - Estresse Alto"
            },
            "Alerta Crítico: Estresse + Fadiga": {
                "status": "Vermelho",
                "color_code": "#dc2626",  # red-600
                "label": "Alerta Crítico"
            }
        }
        
        current_status = last_analysis.get("status", "Normal")
        status_info = status_map.get(current_status, status_map["Normal"])
        
        return EnergyStatus(
            status=status_info["status"],
            color_code=status_info["color_code"],
            label=status_info["label"],
            last_updated=last_analysis.get("timestamp", datetime.now(timezone.utc).isoformat()),
            current_bpm=last_analysis.get("bpm"),
            current_hrv=last_analysis.get("hrv")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting energy status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/dashboard/team-stress", response_model=TeamStressMetrics)
async def get_team_stress_metrics(request: Request):
    """
    Dashboard do Gestor: Métricas de estresse do time (anonimizadas)
    Mostra média de estresse das últimas 24h sem identificar colaboradores
    """
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        # Período: últimas 24h
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        
        # Busca todas as análises das últimas 24h
        analyses = await db.smartwatch_analyses.find(
            {"timestamp": {"$gte": twenty_four_hours_ago.isoformat()}},
            {"_id": 0}
        ).to_list(1000)
        
        if not analyses:
            return TeamStressMetrics(
                period="últimas 24h",
                total_analyses=0,
                average_stress_level=0.0,
                critical_alerts=0,
                medium_alerts=0,
                normal_status=0,
                stress_distribution=[]
            )
        
        # Calcula métricas
        total_analyses = len(analyses)
        critical_count = sum(1 for a in analyses if a.get("risk_level") == "Alto")
        medium_count = sum(1 for a in analyses if a.get("risk_level") == "Médio")
        normal_count = total_analyses - critical_count - medium_count
        
        # Calcula nível médio de estresse (0-100)
        # Alto = 100, Médio = 60, Baixo = 20
        stress_scores = []
        for a in analyses:
            if a.get("risk_level") == "Alto":
                stress_scores.append(100)
            elif a.get("risk_level") == "Médio":
                stress_scores.append(60)
            else:
                stress_scores.append(20)
        
        average_stress = sum(stress_scores) / len(stress_scores) if stress_scores else 0
        
        # Distribuição de estresse (anonimizada por horário)
        stress_distribution = []
        hour_groups = {}
        
        for a in analyses:
            timestamp = datetime.fromisoformat(a["timestamp"])
            hour = timestamp.hour
            
            if hour not in hour_groups:
                hour_groups[hour] = {"hour": f"{hour:02d}:00", "count": 0, "avg_stress": []}
            
            hour_groups[hour]["count"] += 1
            if a.get("risk_level") == "Alto":
                hour_groups[hour]["avg_stress"].append(100)
            elif a.get("risk_level") == "Médio":
                hour_groups[hour]["avg_stress"].append(60)
            else:
                hour_groups[hour]["avg_stress"].append(20)
        
        for hour, data in sorted(hour_groups.items()):
            avg = sum(data["avg_stress"]) / len(data["avg_stress"]) if data["avg_stress"] else 0
            stress_distribution.append({
                "hour": data["hour"],
                "analyses_count": data["count"],
                "avg_stress_level": round(avg, 1)
            })
        
        # Identifica horário de pico de estresse
        peak_stress_time = None
        if stress_distribution:
            peak = max(stress_distribution, key=lambda x: x["avg_stress_level"])
            peak_stress_time = peak["hour"]
        
        return TeamStressMetrics(
            period="últimas 24h",
            total_analyses=total_analyses,
            average_stress_level=round(average_stress, 1),
            critical_alerts=critical_count,
            medium_alerts=medium_count,
            normal_status=normal_count,
            stress_distribution=stress_distribution,
            peak_stress_time=peak_stress_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team stress metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# SMARTWATCH ENDPOINTS (análise)
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
        
        # Envia notificação push se alerta crítico
        if "Crítico" in result["status"] or result["risk_level"] == "Alto":
            notification_sent = await send_push_notification(
                colaborador,
                result["status"],
                result["ai_recommendation"]
            )
            result["push_notification_sent"] = notification_sent
        
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

# GAMIFICATION ENDPOINTS
@api_router.post("/gamification/follow-nudge")
async def follow_nudge(data: FollowNudgeRequest, request: Request):
    """Marca que o usuário seguiu um Nudge da IA. +50 pontos + atualiza streak."""
    try:
        colaborador = await get_current_colaborador(request)
        colab_id = colaborador["id"]
        today = date.today().isoformat()
        
        # Verifica se já seguiu este nudge
        existing = await db.gamification_events.find_one(
            {"colaborador_id": colab_id, "analysis_id": data.analysis_id, "event_type": "nudge_followed"},
            {"_id": 0}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Nudge já seguido para esta análise")
        
        # Calcula streak
        last_nudge_date = colaborador.get("last_nudge_date")
        current_streak = colaborador.get("current_streak", 0)
        longest_streak = colaborador.get("longest_streak", 0)
        
        if last_nudge_date == today:
            pass  # Já contou hoje
        elif last_nudge_date == (date.today() - timedelta(days=1)).isoformat():
            current_streak += 1  # Dia consecutivo
        else:
            current_streak = 1  # Reset
        
        if current_streak > longest_streak:
            longest_streak = current_streak
        
        # Pontos base
        points_earned = 50
        bonus_events = []
        
        # Bônus de streak
        if current_streak == 3 and last_nudge_date != today:
            points_earned += 100
            bonus_events.append({"event_type": "streak_bonus", "points": 100, "streak": 3})
        
        if current_streak == 7 and last_nudge_date != today:
            points_earned += 500
            badge = {
                "name": "Biohacker da Semana",
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "streak_cycle": current_streak // 7
            }
            badges = colaborador.get("badges", [])
            badges.append(badge)
            await db.colaboradores.update_one(
                {"id": colab_id}, {"$set": {"badges": badges}}
            )
            bonus_events.append({"event_type": "badge_earned", "badge": "Biohacker da Semana", "points": 500})
        
        # Renovação a cada 7 dias adicionais
        if current_streak > 7 and current_streak % 7 == 0 and last_nudge_date != today:
            points_earned += 500
            badge = {
                "name": "Biohacker da Semana",
                "earned_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True,
                "streak_cycle": current_streak // 7
            }
            badges = colaborador.get("badges", [])
            badges.append(badge)
            await db.colaboradores.update_one(
                {"id": colab_id}, {"$set": {"badges": badges}}
            )
        
        new_total = colaborador.get("energy_points", 0) + points_earned
        
        # Atualiza colaborador
        await db.colaboradores.update_one(
            {"id": colab_id},
            {"$set": {
                "energy_points": new_total,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_nudge_date": today,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Salva evento
        event = {
            "id": str(uuid.uuid4()),
            "colaborador_id": colab_id,
            "event_type": "nudge_followed",
            "analysis_id": data.analysis_id,
            "points_earned": points_earned,
            "streak_at_time": current_streak,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.gamification_events.insert_one(event)
        
        return {
            "points_earned": points_earned,
            "total_points": new_total,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "bonus_events": bonus_events
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error following nudge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/stats", response_model=GamificationStatsResponse)
async def get_gamification_stats(request: Request):
    """Retorna estatísticas de gamificação do usuário."""
    try:
        colaborador = await get_current_colaborador(request)
        today = date.today().isoformat()
        
        # Conta nudges seguidos hoje
        nudges_today = await db.gamification_events.count_documents({
            "colaborador_id": colaborador["id"],
            "event_type": "nudge_followed",
            "created_at": {"$gte": today}
        })
        
        current_streak = colaborador.get("current_streak", 0)
        next_badge = max(0, 7 - (current_streak % 7)) if current_streak > 0 else 7
        
        return GamificationStatsResponse(
            energy_points=colaborador.get("energy_points", 0),
            current_streak=current_streak,
            longest_streak=colaborador.get("longest_streak", 0),
            badges=colaborador.get("badges", []),
            nudges_followed_today=nudges_today,
            next_badge_in=next_badge
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting gamification stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/gamification/leaderboard")
async def get_leaderboard(request: Request):
    """Top 10 colaboradores por pontos de energia."""
    try:
        await get_current_colaborador(request)
        
        top_users = await db.colaboradores.find(
            {"energy_points": {"$gt": 0}},
            {"_id": 0, "nome": 1, "energy_points": 1, "current_streak": 1, "badges": 1}
        ).sort("energy_points", -1).limit(10).to_list(10)
        
        entries = []
        for i, u in enumerate(top_users):
            first_name = u["nome"].split()[0] if u.get("nome") else "Anon"
            last_initial = u["nome"].split()[-1][0] + "." if len(u.get("nome", "").split()) > 1 else ""
            has_badge = any(b.get("is_active") for b in u.get("badges", []))
            entries.append({
                "rank": i + 1,
                "nome": f"{first_name} {last_initial}",
                "energy_points": u.get("energy_points", 0),
                "current_streak": u.get("current_streak", 0),
                "has_badge": has_badge
            })
        
        return {"period": "all_time", "entries": entries}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# BILLING / PREMIUM ENDPOINTS
@api_router.get("/billing/plan", response_model=PlanInfoResponse)
async def get_plan(request: Request):
    """Retorna informações do plano do usuário."""
    try:
        colaborador = await get_current_colaborador(request)
        account_type = colaborador.get("account_type", "personal")
        is_premium = colaborador.get("is_premium", False)
        
        # Corporativos sempre têm acesso total
        if account_type == "corporate":
            return PlanInfoResponse(
                plan="corporate",
                is_premium=True,
                account_type=account_type,
                limits={
                    "analyses_limit": -1,
                    "has_predictions": True,
                    "has_detailed_nudge": True,
                    "history_days": -1,
                    "wearables_limit": -1
                }
            )
        
        # B2C: Free ou Premium
        today = date.today().isoformat()
        analyses_today = await db.analyses.count_documents({
            "colaborador_id": colaborador["id"],
            "timestamp": {"$gte": today}
        })
        
        if is_premium:
            return PlanInfoResponse(
                plan="premium",
                is_premium=True,
                account_type=account_type,
                limits={
                    "analyses_today": analyses_today,
                    "analyses_limit": -1,
                    "has_predictions": True,
                    "has_detailed_nudge": True,
                    "history_days": -1,
                    "wearables_limit": -1
                }
            )
        
        return PlanInfoResponse(
            plan="free",
            is_premium=False,
            account_type=account_type,
            limits={
                "analyses_today": analyses_today,
                "analyses_limit": 3,
                "has_predictions": False,
                "has_detailed_nudge": False,
                "history_days": 7,
                "wearables_limit": 1
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/billing/upgrade")
async def upgrade_plan(request: Request):
    """Mock: Atualiza plano para Premium."""
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador.get("is_premium"):
            return {"message": "Já é Premium", "is_premium": True}
        
        await db.colaboradores.update_one(
            {"id": colaborador["id"]},
            {"$set": {"is_premium": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": "Upgrade para Premium realizado!", "is_premium": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error upgrading plan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# HEALTH TREND (Lei 14.831)
@api_router.get("/health/trend")
async def get_health_trend(request: Request):
    """
    Analisa tendência de V-Score dos últimos 7 dias.
    Se estresse subindo consistentemente: flag requires_intervention = true (Lei 14.831)
    """
    try:
        colaborador = await get_current_colaborador(request)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        analyses = await db.analyses.find(
            {"colaborador_id": colaborador["id"], "timestamp": {"$gte": seven_days_ago.isoformat()}},
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1}
        ).sort("timestamp", 1).to_list(500)

        if len(analyses) < 2:
            return HealthTrendResponse(
                trend="stable", v_scores_7d=[], avg_7d=0,
                requires_intervention=False
            )

        # Agrupa por dia
        daily = {}
        for a in analyses:
            day = a["timestamp"][:10]
            daily.setdefault(day, []).append(a["v_score"])

        v_scores_7d = [{"date": d, "avg_v_score": round(sum(s)/len(s), 1), "count": len(s)} for d, s in sorted(daily.items())]
        all_scores = [s for scores in daily.values() for s in scores]
        avg_7d = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        # Detecta tendência: compara primeira metade vs segunda metade
        if len(v_scores_7d) >= 2:
            mid = len(v_scores_7d) // 2
            first_half = sum(d["avg_v_score"] for d in v_scores_7d[:mid]) / mid
            second_half = sum(d["avg_v_score"] for d in v_scores_7d[mid:]) / (len(v_scores_7d) - mid)

            if second_half < first_half - 5:
                trend = "falling"
            elif second_half > first_half + 5:
                trend = "rising"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Lei 14.831: intervenção se V-Score médio < 50 OU tendência caindo com média < 60
        requires_intervention = False
        intervention_message = None

        if avg_7d < 50:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - Intervencao Necessaria: V-Score medio de {avg_7d}/100 nos ultimos 7 dias indica risco a saude mental do colaborador."
        elif trend == "falling" and avg_7d < 60:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - Atencao: Tendencia de queda no V-Score (media {avg_7d}/100). Recomenda-se intervencao preventiva."

        # Conta dias consecutivos com V-Score < 50
        consecutive_bad = 0
        for d in reversed(v_scores_7d):
            if d["avg_v_score"] < 50:
                consecutive_bad += 1
            else:
                break
        if consecutive_bad >= 3:
            requires_intervention = True
            intervention_message = f"Lei 14.831 - ALERTA CRITICO: {consecutive_bad} dias consecutivos com V-Score abaixo de 50. Intervencao obrigatoria."

        return HealthTrendResponse(
            trend=trend,
            v_scores_7d=v_scores_7d,
            avg_7d=avg_7d,
            requires_intervention=requires_intervention,
            intervention_message=intervention_message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting health trend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# TEAM OVERVIEW (Gestor - V-Score agregado + LGPD)
@api_router.get("/dashboard/team-overview")
async def get_team_overview(request: Request, period: str = "7d"):
    """
    Visão geral do time para o Gestor.
    V-Score agregado, tendência, alertas Lei 14.831.
    period: 7d, 30d, 6m
    """
    try:
        colaborador = await get_current_colaborador(request)
        if colaborador["nivel_acesso"] != "Gestor":
            raise HTTPException(status_code=403, detail="Acesso negado. Apenas gestores.")

        total_colabs = await db.colaboradores.count_documents({})
        period_map = {"7d": 7, "30d": 30, "6m": 180}
        days = period_map.get(period, 7)
        period_start = datetime.now(timezone.utc) - timedelta(days=days)

        # V-Score agregado de todas as análises
        all_analyses = await db.analyses.find(
            {"timestamp": {"$gte": period_start.isoformat()}},
            {"_id": 0, "v_score": 1, "timestamp": 1, "status_visual": 1, "colaborador_id": 1}
        ).sort("timestamp", 1).to_list(5000)

        if not all_analyses:
            return TeamOverviewResponse(
                total_colaboradores=total_colabs, avg_v_score=0, avg_stress_level=0,
                distribution={"verde": 0, "amarelo": 0, "vermelho": 0},
                trend_7d=[], lei_14831_alerts=0, engagement_rate=0
            )

        # V-Score médio global
        all_scores = [a["v_score"] for a in all_analyses]
        avg_v_score = round(sum(all_scores) / len(all_scores), 1)
        avg_stress = round(100 - avg_v_score, 1)

        # Distribuição
        verde = sum(1 for a in all_analyses if a["v_score"] >= 80)
        amarelo = sum(1 for a in all_analyses if 50 <= a["v_score"] < 80)
        vermelho = sum(1 for a in all_analyses if a["v_score"] < 50)

        # Tendência diária (7 dias) — anonimizado
        daily = {}
        for a in all_analyses:
            day = a["timestamp"][:10]
            daily.setdefault(day, []).append(a["v_score"])

        trend_7d = [{"date": d, "avg_v_score": round(sum(s)/len(s), 1), "total_analyses": len(s)} for d, s in sorted(daily.items())]

        # Alertas Lei 14.831: contar colaboradores únicos com V-Score médio < 50 nos 7 dias
        colab_scores = {}
        for a in all_analyses:
            cid = a.get("colaborador_id", "unknown")
            colab_scores.setdefault(cid, []).append(a["v_score"])

        lei_alerts = sum(1 for scores in colab_scores.values() if sum(scores)/len(scores) < 50)

        # Engagement: % de colaboradores que fizeram pelo menos 1 análise nos 7 dias
        active = len(colab_scores)
        engagement = round((active / total_colabs) * 100, 1) if total_colabs > 0 else 0

        return TeamOverviewResponse(
            total_colaboradores=total_colabs,
            avg_v_score=avg_v_score,
            avg_stress_level=avg_stress,
            distribution={"verde": verde, "amarelo": amarelo, "vermelho": vermelho},
            trend_7d=trend_7d,
            lei_14831_alerts=lei_alerts,
            engagement_rate=engagement
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# WEARABLE OAUTH MOCK (Google Fit)
@api_router.post("/wearables/oauth/callback")
async def wearable_oauth_callback(request: Request):
    """
    Simula callback OAuth do Google Fit / Apple HealthKit.
    Em produção: receberia authorization_code e trocaria por access_token.
    Aqui: cria device + dispara primeira sincronização simulada.
    """
    try:
        colaborador = await get_current_colaborador(request)
        body = await request.json()
        provider = body.get("provider", "google_health_connect")
        # auth_code seria usado em produção para trocar por access_token

        import random

        # Simula dados do wearable
        sync_data = {
            "hrv": random.randint(35, 85),
            "bpm": random.randint(58, 110),
            "bpm_average": random.randint(60, 80),
            "sleep_hours": round(random.uniform(4.5, 9.0), 1),
            "steps": random.randint(2000, 15000),
            "source": provider
        }

        # Cria ou atualiza device
        existing = await db.wearable_devices.find_one(
            {"colaborador_id": colaborador["id"], "provider": provider}, {"_id": 0}
        )

        device_id = existing["id"] if existing else str(uuid.uuid4())

        if existing:
            await db.wearable_devices.update_one(
                {"id": device_id},
                {"$set": {"is_connected": True, "last_sync": datetime.now(timezone.utc).isoformat(), "oauth_token": "mock-token"}}
            )
        else:
            device = {
                "id": device_id,
                "colaborador_id": colaborador["id"],
                "provider": provider,
                "device_name": f"{provider.replace('_', ' ').title()}",
                "is_connected": True,
                "last_sync": datetime.now(timezone.utc).isoformat(),
                "oauth_token": "mock-token",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wearable_devices.insert_one(device)

        return {
            "status": "authorized",
            "device_id": device_id,
            "provider": provider,
            "sync_data": sync_data,
            "message": f"Dispositivo {provider} autorizado e sincronizado automaticamente."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
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
        await db.gamification_events.create_index([("colaborador_id", 1), ("created_at", -1)])
        logger.info("Database indexes created")
        
        # Migrate existing users: add gamification fields if missing
        await db.colaboradores.update_many(
            {"energy_points": {"$exists": False}},
            {"$set": {"energy_points": 0, "current_streak": 0, "longest_streak": 0,
                      "last_nudge_date": None, "badges": [], "is_premium": False}}
        )
        
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
                nivel_acesso="Gestor",
                account_type="personal",
                domain=None
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
                {"domain": domain_data["domain"]},
                {"_id": 0}
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