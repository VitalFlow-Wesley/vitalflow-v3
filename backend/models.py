from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, date
import uuid


# ─── Auth ───
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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class AuthResponse(BaseModel):
    id: str
    nome: str
    email: str
    data_nascimento: str
    foto_url: Optional[str] = None
    setor: str
    nivel_acesso: str
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    account_type: str = "personal"
    domain: Optional[str] = None
    company_name: Optional[str] = None
    is_premium: bool = False
    premium_expires_at: Optional[str] = None
    energy_points: int = 0
    current_streak: int = 0
    must_change_password: bool = False
    must_accept_lgpd: bool = False
    plan: str = "free"
    subscription_status: str = "inactive"
    is_b2b: bool = False


# ─── Colaborador ───
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
    account_type: str = Field(default="personal")
    domain: Optional[str] = None
    is_premium: bool = False
    premium_expires_at: Optional[str] = None
    energy_points: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_nudge_date: Optional[str] = None
    badges: List[dict] = Field(default_factory=list)
    must_change_password: bool = False
    must_accept_lgpd: bool = False
    lgpd_accepted_at: Optional[str] = None
    registered_by_rh: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ColaboradorResponse(BaseModel):
    id: str
    nome: str
    data_nascimento: str
    email: str
    foto_url: Optional[str] = None
    setor: str
    nivel_acesso: str
    matricula: Optional[str] = None
    cargo: Optional[str] = None
    account_type: str = "personal"
    domain: Optional[str] = None
    gestor_imediato_matricula: Optional[str] = None
    created_at: str = ""
    updated_at: str = ""


# ─── Domain ───
class CorporateDomain(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    domain: str
    company_name: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DomainCheckResponse(BaseModel):
    is_corporate: bool
    domain: Optional[str] = None
    company_name: Optional[str] = None
    account_type: str


# ─── Predictive ───
class PredictiveAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    colaborador_id: str
    predicted_stress_time: str
    current_time: str
    minutes_until_stress: int
    confidence: float = Field(..., ge=0, le=100)
    ai_message: str
    pattern_detected: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─── Analysis ───
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


# ─── Wearable ───
class WearableConnectionRequest(BaseModel):
    provider: str
    device_name: str = "My Device"


class WearableConnectionResponse(BaseModel):
    id: str
    provider: str
    device_name: str
    is_connected: bool
    last_sync: Optional[str] = None
    created_at: str


# ─── Dashboard ───
class DashboardMetrics(BaseModel):
    total_colaboradores: int
    total_analises: int
    media_v_score: float
    colaboradores_criticos: int
    colaboradores_atencao: int
    colaboradores_otimo: int
    analises_por_setor: dict


class TeamOverviewResponse(BaseModel):
    total_colaboradores: int
    avg_v_score: float
    avg_stress_level: float
    distribution: dict
    trend_7d: List[dict]
    lei_14831_alerts: int
    engagement_rate: float


# ─── Smartwatch ───
class MovementData(BaseModel):
    accelerometer_x: float = 0.0
    accelerometer_y: float = 0.0
    accelerometer_z: float = 0.0
    gyroscope_x: float = 0.0
    gyroscope_y: float = 0.0
    gyroscope_z: float = 0.0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SmartwatchData(BaseModel):
    bpm: int = Field(..., ge=40, le=220)
    hrv: int = Field(..., ge=0, le=200)
    movement_data: Optional[MovementData] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SmartwatchAnalysisResult(BaseModel):
    anonymous_id: str
    status: str
    bpm: int
    hrv: int
    is_stationary: bool
    stationary_duration_minutes: Optional[float] = None
    ai_recommendation: str
    detected_at: str
    risk_level: str
    push_notification_sent: bool = False
    is_exercise: bool = False


class EnergyStatus(BaseModel):
    status: str
    color_code: str
    label: str
    last_updated: str
    current_bpm: Optional[int] = None
    current_hrv: Optional[int] = None


class TeamStressMetrics(BaseModel):
    period: str = "ultimas 24h"
    total_analyses: int
    average_stress_level: float = Field(..., ge=0, le=100)
    critical_alerts: int
    medium_alerts: int
    normal_status: int
    stress_distribution: List[dict]
    peak_stress_time: Optional[str] = None


# ─── Gamification ───
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


# ─── Health Trend (Lei 14.831) ───
class HealthTrendResponse(BaseModel):
    trend: str
    v_scores_7d: List[dict]
    avg_7d: float
    requires_intervention: bool
    intervention_message: Optional[str] = None
    medical_alert: Optional[dict] = None