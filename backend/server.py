from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

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

# Models
class BiometricInput(BaseModel):
    hrv: int = Field(..., ge=0, le=200, description="Heart Rate Variability (ms)")
    bpm: int = Field(..., ge=40, le=200, description="Current BPM")
    bpm_average: int = Field(..., ge=40, le=120, description="Average resting BPM")
    sleep_hours: float = Field(..., ge=0, le=24, description="Hours of sleep")
    cognitive_load: int = Field(..., ge=0, le=10, description="Cognitive load level 0-10")
    user_name: str = Field(default="Usuário", description="User name")
    age: int = Field(default=30, ge=18, le=120, description="User age")

class Analysis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    v_score: int = Field(..., ge=0, le=100)
    area_afetada: List[str]
    status_visual: str  # Verde, Amarelo, Vermelho
    tag_rapida: str
    causa_provavel: str
    nudge_acao: str
    input_data: BiometricInput
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

# AI Analysis Function
async def analyze_biometrics(data: BiometricInput) -> dict:
    """
    Usa LLM para analisar dados biométricos e gerar diagnóstico
    """
    try:
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"analysis-{uuid.uuid4()}",
            system_message="""
Você é o motor de análise preditiva do VitalFlow, um copiloto de longevidade e saúde mental.
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
  "nudge_acao": "<ação de 5 minutos que o usuário pode fazer agora>"
}
"""
        ).with_model("openai", "gpt-4o")
        
        # Create analysis prompt
        prompt = f"""
ANALISE OS DADOS BIOMÉTRICOS:

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
        
        # Parse JSON response
        import json
        # Clean response if it has markdown code blocks
        response_text = response.strip()
        if response_text.startswith('```'):
            # Remove markdown code blocks
            lines = response_text.split('\n')
            response_text = '\n'.join([line for line in lines if not line.startswith('```')])
        
        analysis_data = json.loads(response_text)
        return analysis_data
        
    except Exception as e:
        logger.error(f"Error in AI analysis: {str(e)}")
        # Fallback to rule-based analysis
        return fallback_analysis(data)

def fallback_analysis(data: BiometricInput) -> dict:
    """
    Análise baseada em regras quando LLM falha
    """
    bpm_increase = ((data.bpm - data.bpm_average) / data.bpm_average) * 100
    
    # Calculate V-Score
    score = 100
    areas = []
    
    # HRV penalty
    if data.hrv < 30:
        score -= 30
        areas.append("Cérebro")
        areas.append("Coração")
    elif data.hrv < 50:
        score -= 15
        areas.append("Coração")
    
    # BPM penalty
    if bpm_increase > 25:
        score -= 25
        areas.append("Coração")
    elif bpm_increase > 15:
        score -= 15
        if "Coração" not in areas:
            areas.append("Coração")
    
    # Sleep penalty
    if data.sleep_hours < 5:
        score -= 20
        if "Cérebro" not in areas:
            areas.append("Cérebro")
    elif data.sleep_hours < 6:
        score -= 10
    
    # Cognitive load + sleep penalty
    if data.cognitive_load > 7 and data.sleep_hours < 6:
        score -= 15
        if "Cérebro" not in areas:
            areas.append("Cérebro")
    
    score = max(0, min(100, score))
    
    # Determine status
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
    
    # Generate cause and nudge
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

# Routes
@api_router.get("/")
async def root():
    return {"message": "VitalFlow API - Copiloto de Longevidade"}

@api_router.post("/analyze", response_model=AnalysisResponse)
async def create_analysis(input_data: BiometricInput):
    """
    Cria uma nova análise biométrica
    """
    try:
        # Get AI analysis
        analysis_result = await analyze_biometrics(input_data)
        
        # Create Analysis object
        analysis = Analysis(
            v_score=analysis_result["v_score"],
            area_afetada=analysis_result["area_afetada"],
            status_visual=analysis_result["status_visual"],
            tag_rapida=analysis_result["tag_rapida"],
            causa_provavel=analysis_result["causa_provavel"],
            nudge_acao=analysis_result["nudge_acao"],
            input_data=input_data
        )
        
        # Save to database
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
            timestamp=analysis.timestamp.isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error creating analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=List[AnalysisResponse])
async def get_history(limit: int = 10):
    """
    Retorna histórico de análises
    """
    try:
        analyses = await db.analyses.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return [
            AnalysisResponse(
                id=a["id"],
                v_score=a["v_score"],
                area_afetada=a["area_afetada"],
                status_visual=a["status_visual"],
                tag_rapida=a["tag_rapida"],
                causa_provavel=a["causa_provavel"],
                nudge_acao=a["nudge_acao"],
                timestamp=a["timestamp"]
            )
            for a in analyses
        ]
        
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: str):
    """
    Retorna uma análise específica
    """
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
            timestamp=analysis["timestamp"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis: {str(e)}")
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