# VitalFlow - Arquitetura Final Consolidada
## Motor de Analise Preditiva e Copiloto de Longevidade & Saude Mental

**Versao:** 2.0 (MVP Completo + Gamificacao + Premium + Boas-Vindas)
**Data:** Fevereiro 2026
**Stack:** React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)
**Testes:** 100% backend (15/15) + 100% frontend (13/13)

---

# PARTE I - SISTEMA IMPLEMENTADO COMPLETO

---

## 1. VISAO GERAL TECNICA

### 1.1 O que e o VitalFlow?
Um sistema de analise preditiva de saude que recebe dados biometricos (HRV, BPM, Carga Cognitiva, Sono) e os transforma em:
- **V-Score** (0-100): Pontuacao de vitalidade
- **Area Afetada**: Cerebro, Coracao, Musculos, Sistema Digestivo
- **Status Visual**: Verde (Otimo), Amarelo (Atencao), Vermelho (Alerta)
- **Nudge_Acao**: Tarefa rapida de 5 minutos gerada por IA (GPT-4o)

### 1.2 Todas as Funcionalidades Implementadas

| # | Funcionalidade | Descricao | Status |
|---|---|---|---|
| 1 | **Autenticacao JWT** | Login/Registro com cookies HttpOnly, refresh token (7 dias) | Completo |
| 2 | **Filtro de Dominio Corporativo (Camaleao)** | Diferencia contas B2C de B2B pelo dominio do email | Completo |
| 3 | **Analise Biometrica com IA** | GPT-4o retorna V-Score + diagnostico + nudge | Completo |
| 4 | **StatusOrb (Esfera Abstrata)** | Esfera animada: Verde=4s, Amarelo=2.4s, Vermelho=1.2s+vibracao | Completo |
| 5 | **EnergyStatus (Bolinha Visual)** | Indicador pulsante na Navbar | Completo |
| 6 | **Conectar Dispositivos (Wearables)** | Google, Apple, Garmin, Fitbit | Completo |
| 7 | **Webhook de Smartwatch** | BPM/HRV/Giroscopio; detecta estresse e fadiga | Completo |
| 8 | **Anonimizacao LGPD** | UUID anonimo por analise | Completo |
| 9 | **Notificacoes Push Simuladas** | Toast alerts para status critico | Completo |
| 10 | **Dashboard do Gestor** | Metricas anonimizadas do time | Completo |
| 11 | **IA Preditiva** | Preve estresse 30min antes (trava Premium para B2C Free) | Completo |
| 12 | **Exportacao de Relatorio PDF** | Dados formatados para PDF | Completo |
| 13 | **MetricBars** | Barras de progresso HRV/BPM/Sono/Carga Cognitiva | Completo |
| 14 | **UI Minimalista** | Elementos abstratos sem imagem anatomica | Completo |
| 15 | **Gamificacao: Pontos de Energia** | +50 pts por nudge seguido, +10 por analise | Completo |
| 16 | **Gamificacao: Streaks** | Dias consecutivos; bonus +100 (3d), +500 (7d) | Completo |
| 17 | **Gamificacao: Badge Biohacker** | Badge "Biohacker da Semana" ao atingir 7 dias | Completo |
| 18 | **Gamificacao: Leaderboard** | Top 10 colaboradores por pontos | Completo |
| 19 | **Trava Premium (B2C)** | Free: sem predicoes IA. Premium: acesso total | Completo |
| 20 | **Boas-Vindas Corporativas** | Toast personalizado com nome + empresa ao login | Completo |

---

## 2. ENDPOINTS DA API (IMPLEMENTADOS)

### 2.1 Autenticacao (`/api/auth/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/auth/register` | Cadastro de novo colaborador. Detecta automaticamente se e corporativo pelo dominio do email | Nao |
| `POST` | `/api/auth/login` | Login. Retorna tokens JWT em cookies HttpOnly | Nao |
| `POST` | `/api/auth/logout` | Logout. Remove cookies de token | Nao |
| `GET` | `/api/auth/me` | Retorna dados do usuario logado (sem password_hash) | Sim |
| `PUT` | `/api/auth/profile` | Atualiza nome, data de nascimento e foto do perfil | Sim |
| `GET` | `/api/auth/check-domain?email=x@y.com` | Verifica se email pertence a dominio corporativo cadastrado | Nao |

**Modelo de Resposta (`AuthResponse`):**
```json
{
  "id": "uuid",
  "nome": "Joao Silva",
  "email": "joao@empresa.com",
  "data_nascimento": "1990-01-15",
  "foto_url": null,
  "setor": "Administrativo",
  "nivel_acesso": "User",
  "matricula": null,
  "cargo": null,
  "account_type": "corporate",
  "domain": "empresa.com"
}
```

### 2.2 Analise Biometrica (`/api/analyze`, `/api/history`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/analyze` | Envia dados biometricos e recebe analise completa da IA | Sim |
| `GET` | `/api/history?limit=30` | Historico de analises do colaborador logado | Sim |

**Body do `POST /api/analyze`:**
```json
{
  "hrv": 45,
  "bpm": 95,
  "bpm_average": 70,
  "sleep_hours": 5.5,
  "cognitive_load": 8,
  "user_name": "Joao",
  "age": 32
}
```

**Modelo de Resposta (`AnalysisResponse`):**
```json
{
  "id": "uuid",
  "v_score": 42,
  "area_afetada": ["Cerebro", "Coracao"],
  "status_visual": "Vermelho",
  "tag_rapida": "Overload Cognitivo",
  "causa_provavel": "HRV baixa (45ms) indica estresse do SN. BPM 35% acima da media.",
  "nudge_acao": "Faca 5 minutos de respiracao 4-7-8 e beba 300ml de agua gelada.",
  "timestamp": "2026-02-01T14:30:00Z",
  "colaborador_id": "uuid"
}
```

### 2.3 Smartwatch (`/api/smartwatch/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/smartwatch/analyze` | Analise em tempo real de dados do smartwatch + recomendacao IA | Sim |
| `POST` | `/api/smartwatch/webhook?device_token=x` | Webhook para receber dados de smartwatches reais | Token |
| `GET` | `/api/smartwatch/history?limit=20` | Historico de analises do smartwatch (anonimizado) | Sim |

**Body do `POST /api/smartwatch/analyze`:**
```json
{
  "bpm": 115,
  "hrv": 35,
  "movement_data": {
    "accelerometer_x": 0.0,
    "accelerometer_y": 0.0,
    "accelerometer_z": 0.0,
    "gyroscope_x": 0.0,
    "gyroscope_y": 0.0,
    "gyroscope_z": 0.0
  }
}
```

**Modelo de Resposta (`SmartwatchAnalysisResult`):**
```json
{
  "anonymous_id": "uuid-anonimo-lgpd",
  "status": "Alerta de Estresse",
  "bpm": 115,
  "hrv": 35,
  "is_stationary": false,
  "stationary_duration_minutes": null,
  "ai_recommendation": "Titulo: Respiracao Box\nAcao: Inspire 4s, segure 4s, expire 4s...",
  "detected_at": "2026-02-01T15:00:00Z",
  "risk_level": "Alto",
  "push_notification_sent": true
}
```

### 2.4 Status de Energia (`/api/status/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `GET` | `/api/status/energy` | Status em tempo real (bolinha Verde/Amarelo/Vermelho) | Sim |

**Modelo de Resposta (`EnergyStatus`):**
```json
{
  "status": "Amarelo",
  "color_code": "#fbbf24",
  "label": "Atencao - Fadiga Detectada",
  "last_updated": "2026-02-01T15:00:00Z",
  "current_bpm": 85,
  "current_hrv": 42
}
```

### 2.5 IA Preditiva (`/api/predictive/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `GET` | `/api/predictive/alert` | Verifica se ha padrao de estresse previsto e retorna alerta preventivo | Sim |

**Modelo de Resposta (com alerta):**
```json
{
  "has_alert": true,
  "alert": {
    "message": "Joao, seu historico mostra picos de estresse as tercas-feiras as 14h...",
    "predicted_time": "14:00",
    "minutes_until": 45,
    "confidence": 85.7,
    "pattern": "Pico de estresse detectado as tercas-feiras as 14h (3x em 7 dias)"
  }
}
```

### 2.6 Dashboard do Gestor (`/api/dashboard/*`)

| Metodo | Rota | Descricao | Auth? | Permissao |
|--------|------|-----------|-------|-----------|
| `GET` | `/api/dashboard/metrics` | Metricas gerais: total colaboradores, media V-Score, distribuicao | Sim | Gestor |
| `GET` | `/api/dashboard/team-stress` | Metricas de estresse do time (anonimizadas por LGPD) | Sim | Gestor |
| `GET` | `/api/dashboard/export-pdf` | Exporta dados do relatorio para PDF | Sim | Gestor |
| `GET` | `/api/colaboradores?setor=SAC` | Lista colaboradores (filtro por setor) | Sim | Gestor |

**Modelo de Resposta (`TeamStressMetrics`):**
```json
{
  "period": "ultimas 24h",
  "total_analyses": 150,
  "average_stress_level": 45.2,
  "critical_alerts": 12,
  "medium_alerts": 38,
  "normal_status": 100,
  "stress_distribution": [
    {"hour": "09:00", "analyses_count": 25, "avg_stress_level": 30.5},
    {"hour": "14:00", "analyses_count": 40, "avg_stress_level": 72.0}
  ],
  "peak_stress_time": "14:00"
}
```

### 2.7 Wearables (`/api/wearables/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/wearables/connect` | Conecta um dispositivo wearable | Sim |
| `GET` | `/api/wearables` | Lista dispositivos conectados do colaborador | Sim |
| `DELETE` | `/api/wearables/{device_id}` | Desconecta um dispositivo | Sim |

### 2.8 Gamificacao (`/api/gamification/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/gamification/follow-nudge` | Marca nudge como seguido (+50 pts, atualiza streak) | Sim |
| `GET` | `/api/gamification/stats` | Retorna pontos, streak, badges, nudges hoje | Sim |
| `GET` | `/api/gamification/leaderboard` | Top 10 colaboradores por pontos | Sim |

**Body do `POST /api/gamification/follow-nudge`:**
```json
{"analysis_id": "uuid-da-analise"}
```

**Resposta:**
```json
{
  "points_earned": 50,
  "total_points": 150,
  "current_streak": 3,
  "longest_streak": 3,
  "bonus_events": [{"event_type": "streak_bonus", "points": 100, "streak": 3}]
}
```

### 2.9 Billing / Premium (`/api/billing/*`)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `GET` | `/api/billing/plan` | Retorna plano atual e limites | Sim |
| `POST` | `/api/billing/upgrade` | Mock: Upgrade para Premium | Sim |

**Resposta do `GET /api/billing/plan` (Free):**
```json
{
  "plan": "free",
  "is_premium": false,
  "account_type": "personal",
  "limits": {
    "analyses_today": 2,
    "analyses_limit": 3,
    "has_predictions": false,
    "has_detailed_nudge": false,
    "history_days": 7,
    "wearables_limit": 1
  }
}
```

---

## 3. LOGICA DE NEGOCIO (IMPLEMENTADA)

### 3.1 Diferenciacao B2B vs B2C (Sistema Camaleao)

```
REGISTRO DE USUARIO
       |
       v
[Extrai dominio do email]  (ex: joao@brisanet.com.br -> "brisanet.com.br")
       |
       v
[Busca no MongoDB: corporate_domains]
       |
  +----+----+
  |         |
  v         v
ENCONTROU   NAO ENCONTROU
  |              |
  v              v
account_type:  account_type:
"corporate"    "personal"
  |              |
  v              v
Acesso a:      Acesso a:
- Dashboard    - Dashboard
  Pessoal        Pessoal
- Dashboard    - Perfil
  Gestor       - Wearables
  (se Gestor)  - Analise IA
- Perfil
- Wearables
- Analise IA
```

**Dominios Corporativos Cadastrados (Seed):**
- `brisanet.com.br` -> Brisanet
- `vitalflow.com` -> VitalFlow
- `emergent.sh` -> Emergent

**Regra:** A diferenciacao e AUTOMATICA. O sistema detecta pelo dominio do email no momento do registro. Nao ha tela de selecao "pessoal vs corporativo".

### 3.2 Calculo do V-Score

A IA (GPT-4o) recebe os dados biometricos e retorna o V-Score aplicando estas regras:

| Parametro | Faixa Normal | Alerta | Critico |
|-----------|-------------|--------|---------|
| HRV | > 50ms | 30-50ms | < 30ms |
| BPM vs Media | < 15% acima | 15-25% acima | > 25% acima |
| Sono | > 7h | 5-6h | < 5h |
| Carga Cognitiva | 0-5 | 6-7 | 8-10 (c/ sono < 6h) |

**Faixas do V-Score:**
- 80-100: Verde (Otimo) -> Manter habitos
- 50-79: Amarelo (Atencao) -> Intervencao leve
- 0-49: Vermelho (Alerta) -> Acao imediata necessaria

### 3.3 Deteccao de Estresse e Fadiga (Smartwatch)

```
DADOS DO SMARTWATCH
       |
       v
[BPM > 100 E HRV < 50?]
       |
  +----+----+
  SIM       NAO
  |          |
  v          v
"Alerta    [Acelerometro ~0 por > 60min?]
 de           |
 Estresse"   +----+----+
  |          SIM       NAO
  |           |          |
  |           v          v
  |      "Sinal de   "Normal"
  |       Fadiga"
  |
  v
[Gera UUID anonimo (LGPD)]
  |
  v
[GPT-4o gera recomendacao de Reset de Foco]
  |
  v
[Se Critico: Dispara notificacao push]
```

### 3.4 IA Preditiva (Prevencao de Estresse)

1. Busca ultimas 7 dias de analises do smartwatch
2. Agrupa por dia da semana + hora (ex: "segunda_14h")
3. Calcula media de estresse por slot temporal
4. Se media >= 70/100 com >= 2 ocorrencias, detecta padrao
5. Se o padrao esta entre 30min e 2h no futuro, gera alerta preventivo via GPT-4o
6. Retorna mensagem personalizada com confianca baseada na frequencia

### 3.5 Niveis de Acesso

| Nivel | Acesso |
|-------|--------|
| **User** | Dashboard pessoal, analise biometrica, wearables, perfil |
| **Gestor** | Tudo do User + Dashboard do Gestor (metricas anonimizadas do time), exportacao PDF, lista de colaboradores |

---

## 4. ARQUITETURA DE ARQUIVOS

```
/app/
+-- backend/
|   +-- server.py                    # FastAPI (1702 linhas) - TODA logica de negocio
|   |   +-- Modelos Pydantic         # (linhas 91-314) - 15+ modelos de dados
|   |   +-- Funcoes de IA            # (linhas 317-440) - Analise biometrica GPT-4o
|   |   +-- Smartwatch Engine        # (linhas 443-577) - Deteccao estresse/fadiga
|   |   +-- Domain Functions         # (linhas 579-601) - Filtro dominio corporativo
|   |   +-- Predictive AI            # (linhas 604-735) - Padroes de estresse
|   |   +-- Push Notifications       # (linhas 738-797) - Notificacoes simuladas
|   |   +-- Auth Endpoints           # (linhas 800-1000) - Login/Register/Profile
|   |   +-- Analysis Endpoints       # (linhas 1002-1069) - Criar/Buscar analises
|   |   +-- Wearable Endpoints       # (linhas 1071-1142) - CRUD dispositivos
|   |   +-- Gestor Endpoints         # (linhas 1144-1490) - Metricas/Time/Export
|   |   +-- Smartwatch Endpoints     # (linhas 1492-1586) - Analyze/Webhook/History
|   |   +-- Startup/Seed             # (linhas 1612-1698) - Indexes/Admin/Domains
|   +-- smartwatch_simulator.py      # Script de teste do webhook (4 cenarios)

---

# PARTE II - LOGICA DE GAMIFICACAO, PREMIUM E BOAS-VINDAS (IMPLEMENTADA)

|   +-- requirements.txt             # 27 dependencias Python
|   +-- .env                         # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY, etc.
|
+-- frontend/
|   +-- package.json                 # React 19 + 40+ dependencias
|   +-- src/
|   |   +-- App.js                   # Roteamento com React Router v7
|   |   +-- contexts/
|   |   |   +-- AuthContext.js       # Estado global de autenticacao
|   |   +-- components/
|   |   |   +-- StatusOrb.js         # Esfera abstrata com pulsacao variavel por status
|   |   |   +-- MetricBars.js        # Barras de progresso biometricas + areas afetadas
|   |   |   +-- EnergyStatus.js      # Bolinha pulsante Verde/Amarelo/Vermelho
|   |   |   +-- VScoreDisplay.js     # Display grande do V-Score com animacao
|   |   |   +-- AIAnalysis.js        # Card de tag + causa provavel
|   |   |   +-- NudgeCard.js         # Card de acao imediata (5 min)
|   |   |   +-- BiometricForm.js     # Modal de entrada de dados biometricos
|   |   |   +-- HistoryChart.js      # Grafico de linha (recharts)
|   |   |   +-- Navbar.js            # Navegacao + EnergyStatus + Dropdown
|   |   |   +-- ProtectedRoute.js    # HOC de protecao de rotas
|   |   |   +-- HumanBodyHeatmap.js  # [DEPRECIADO] Substituido por StatusOrb
|   |   |   +-- AffectedAreas.js     # [DEPRECIADO] Integrado ao MetricBars
|   |   |   +-- ui/                  # Componentes Shadcn UI (20+ componentes)
|   |   +-- pages/
|   |       +-- Dashboard.js         # Tela principal (V-Score + Heatmap + Nudge)
|   |       +-- GestorDashboard.js   # Painel do Gestor (graficos + metricas)
|   |       +-- ConnectDevices.js    # Integracao com wearables (4 providers)
|   |       +-- Profile.js           # Edicao de perfil + foto
|   |       +-- Login.js             # Tela de login
|   |       +-- Register.js          # Tela de cadastro
|   +-- .env                         # REACT_APP_BACKEND_URL
|
+-- memory/
    +-- PRD.md                       # Documento de requisitos do produto
    +-- test_credentials.md          # Credenciais de teste
```

---

## 5. BANCO DE DADOS (MongoDB)

### 5.1 Collections (Implementadas)

| Collection | Descricao | Documentos Tipicos |
|------------|-----------|-------------------|
| `colaboradores` | Usuarios do sistema | ~10-1000 |
| `analyses` | Analises biometricas (V-Score) | ~100-10000 |
| `smartwatch_analyses` | Dados de smartwatch processados | ~1000-100000 |
| `wearable_devices` | Dispositivos conectados | ~10-1000 |
| `corporate_domains` | Dominios corporativos cadastrados | ~3-50 |
| `predictive_alerts` | Alertas preditivos gerados | ~10-1000 |
| `notifications` | Historico de notificacoes push | ~100-10000 |

### 5.2 Schema: Colaborador (Atual)
```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string (unique, indexed)",
  "password_hash": "string (bcrypt)",
  "data_nascimento": "string (ISO date)",
  "foto_url": "string | null",
  "setor": "Administrativo | SAC | Logistica | Operacional",
  "nivel_acesso": "User | Gestor",
  "matricula": "string | null (apenas corporativo)",
  "cargo": "string | null (apenas corporativo)",
  "account_type": "personal | corporate",
  "domain": "string | null",
  "created_at": "string (ISO datetime)",
  "updated_at": "string (ISO datetime)"
}
```

### 5.3 Indexes
- `colaboradores.email` -> unique index

---

## 6. INTEGRACOES DE TERCEIROS

| Servico | Uso | Chave |
|---------|-----|-------|
| **Emergent LLM (GPT-4o)** | Analise biometrica, geracao de Nudges, recomendacoes de Reset de Foco, alertas preditivos | `EMERGENT_LLM_KEY` (via `emergentintegrations`) |

**Biblioteca:** `emergentintegrations==0.1.0`
```python
from emergentintegrations.llm.chat import LlmChat, UserMessage
chat = LlmChat(
    api_key=os.environ['EMERGENT_LLM_KEY'],
    session_id="unique-session-id",
    system_message="..."
).with_model("openai", "gpt-4o")
response = await chat.send_message(UserMessage(text="..."))
```

---

## 7. CREDENCIAIS DE TESTE

| Conta | Email | Senha | Tipo | Nivel |
|-------|-------|-------|------|-------|
| Admin | `admin@vitalflow.com` | `Admin123!@#` | Personal | Gestor |

Para criar conta corporativa, registre com email `@brisanet.com.br`, `@vitalflow.com` ou `@emergent.sh`.

---

## 8. CODIGO-FONTE - MAPA DE REFERENCIA

### Backend Principal: `/app/backend/server.py`

**Estrutura do arquivo (1702 linhas):**

```
Linhas 1-28    : Imports e conexao MongoDB
Linhas 29-85   : Autenticacao (hash, JWT, helper get_current_colaborador)
Linhas 86-314  : Modelos Pydantic (15+ modelos)
Linhas 317-440 : Funcao analyze_biometrics() - Motor de IA principal
Linhas 443-577 : Funcoes de Smartwatch (deteccao de estresse/fadiga)
Linhas 579-601 : Verificacao de dominio corporativo
Linhas 604-735 : IA Preditiva (analise de padroes de estresse)
Linhas 738-797 : Notificacoes Push simuladas
Linhas 800-1000: Endpoints de Autenticacao (register, login, logout, me, profile)
Linhas 1002-1069: Endpoints de Analise (create, history)
Linhas 1071-1142: Endpoints de Wearables (connect, list, disconnect)
Linhas 1144-1321: Endpoints do Dashboard Gestor (metrics, team-stress, export-pdf)
Linhas 1323-1586: Endpoints de Smartwatch (analyze, webhook, history, energy)
Linhas 1588-1702: CORS, Startup (seed admin, seed dominios), Shutdown
```

### Frontend Principal: 16 arquivos React

| Arquivo | Funcao | Linhas |
|---------|--------|--------|
| `App.js` | Roteamento e providers | 61 |
| `AuthContext.js` | Estado global de auth | 115 |
| `Dashboard.js` | Tela principal (Orb + MetricBars + Nudge) | 178 |
| `GestorDashboard.js` | Painel do gestor | 260 |
| `ConnectDevices.js` | Integracao wearables | 284 |
| `Profile.js` | Edicao de perfil | 244 |
| `Login.js` | Tela de login | 127 |
| `Register.js` | Tela de cadastro | 199 |
| `StatusOrb.js` | Esfera abstrata com pulsacao dinamica | 207 |
| `MetricBars.js` | Barras de progresso + areas afetadas | 153 |
| `EnergyStatus.js` | Bolinha de status na Navbar | 102 |
| `VScoreDisplay.js` | Display do V-Score | 118 |
| `BiometricForm.js` | Modal de entrada de dados | 198 |
| `NudgeCard.js` | Card de acao imediata | 90 |
| `AIAnalysis.js` | Card de diagnostico IA | 79 |
| `HistoryChart.js` | Grafico de evolucao | 100 |
| `Navbar.js` | Navegacao principal | 138 |

---

## 9. VARIAVEIS DE AMBIENTE

### Backend (`/app/backend/.env`)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
EMERGENT_LLM_KEY=sk-emergent-XXXXX
JWT_SECRET=<string-64-chars>
ADMIN_EMAIL=admin@vitalflow.com
ADMIN_PASSWORD=Admin123!@#
FRONTEND_URL=https://your-app.preview.emergentagent.com
CORS_ORIGINS=*
```

### Frontend (`/app/frontend/.env`)
```
REACT_APP_BACKEND_URL=https://your-app.preview.emergentagent.com
```

---

## 10. COMO EXECUTAR

### Pre-requisitos
- Python 3.11+
- Node.js 18+ e Yarn
- MongoDB 6+ rodando localmente (porta 27017)

### 1. Configurar variaveis de ambiente

**Backend** (`/app/backend/.env`):
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=vitalflow
EMERGENT_LLM_KEY=<sua-chave-emergent>
JWT_SECRET=<string-aleatoria-64-chars>
ADMIN_EMAIL=admin@vitalflow.com
ADMIN_PASSWORD=Admin123!@#
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=*
```

**Frontend** (`/app/frontend/.env`):
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 2. Instalar dependencias e iniciar

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 - Frontend
cd frontend
yarn install
yarn start
```

### 3. Verificar que esta funcionando

```bash
# Testar API
curl http://localhost:8001/api/

# Esperado: {"message":"VitalFlow API - Copiloto Corporativo de Longevidade"}

# Login admin
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vitalflow.com","password":"Admin123!@#"}'

# Criar analise
curl -b cookies.txt -X POST http://localhost:8001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"hrv":45,"bpm":95,"bpm_average":70,"sleep_hours":5.5,"cognitive_load":8,"user_name":"Admin","age":35}'

# Seguir nudge (gamificacao)
# Use o "id" retornado pela analise acima
curl -b cookies.txt -X POST http://localhost:8001/api/gamification/follow-nudge \
  -H "Content-Type: application/json" \
  -d '{"analysis_id":"<id-da-analise>"}'

# Verificar stats
curl -b cookies.txt http://localhost:8001/api/gamification/stats
curl -b cookies.txt http://localhost:8001/api/billing/plan
```

### 4. Testar Smartwatch (opcional)
```bash
cd backend
python smartwatch_simulator.py
```

### 5. Producao (Emergent Platform)
```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### 3.6 Comportamento do StatusOrb (Interface Visual)

O StatusOrb e o elemento visual central da interface. Seu comportamento muda conforme o status:

| Status | Cor | Pulsacao | Efeito | Transicao |
|--------|-----|----------|--------|-----------|
| **Verde (Normal)** | `#34d399` (Emerald) | Lenta (4s ciclo) - como respiracao calma | Glow suave, rings lentos | Fade 1.5s |
| **Amarelo (Atencao)** | `#fbbf24` (Amber) | Media (2.4s ciclo) - ritmo atento | Glow medio, rings acelerados | Fade 1.5s |
| **Vermelho (Critico)** | `#f43f5e` (Rose) | Rapida (1.2s ciclo) + vibracao lateral | Glow intenso + brilho pulsante | Fade 1.5s |

**Regra de Transicao:** Quando o estado muda (ex: Verde -> Amarelo), a cor, glow e velocidade de pulsacao transicionam suavemente via CSS `transition: 1.5s ease-in-out`. Nao ha "piscar" ou mudanca abrupta.

**Elementos visuais do Orb:**
1. Anel externo (200px) - pulsacao lenta
2. Anel medio (160px) - pulsacao com delay
3. Glow difuso (blur 20px) atras do orb
4. Esfera principal (120px) com gradiente radial + highlight interno
5. V-Score centralizado com sombra de texto colorida
6. Label de status abaixo com AnimatePresence (fade in/out)
7. Tags de areas afetadas como pills coloridas

---

---

## 11. MODULO DE GAMIFICACAO - PONTOS DE ENERGIA, STREAKS & BADGES

### 11.1 Visao Geral

O modulo de Gamificacao adiciona uma camada de engajamento ao VitalFlow. Os colaboradores ganham **Pontos de Energia** ao seguir as recomendacoes da IA (Nudges), acumulam **Streaks** (dias consecutivos de adesao) e podem conquistar o badge **"Biohacker da Semana"**.

### 11.2 Regras de Negocio

#### 11.2.1 Pontos de Energia

| Regra | Valor |
|-------|-------|
| Seguir um Nudge da IA (clicar "Iniciar Agora" no NudgeCard) | **+50 pontos** |
| Completar analise biometrica diaria | **+10 pontos** |
| Manter streak de 3 dias | **+100 pontos bonus** |
| Manter streak de 7 dias (Biohacker da Semana) | **+500 pontos bonus** |

**Logica de Acumulo:**
```
USUARIO CLICA "INICIAR AGORA" NO NUDGE
       |
       v
[Backend recebe POST /api/gamification/follow-nudge]
       |
       v
[Valida: nudge_id existe? Ja foi seguido hoje?]
       |
  +----+----+
  SIM       NAO (duplicado)
  |              |
  v              v
+50 pontos     Retorna erro
  |            "Nudge ja seguido"
  v
[Atualiza energy_points no colaborador]
  |
  v
[Verifica e atualiza streak]
  |
  v
[Retorna novo total + streak atual]
```

#### 11.2.2 Sistema de Streaks (Dias Consecutivos)

| Campo | Descricao |
|-------|-----------|
| `current_streak` | Numero de dias consecutivos que o usuario seguiu pelo menos 1 Nudge |
| `longest_streak` | Maior streak ja atingido (recorde pessoal) |
| `last_nudge_date` | Data do ultimo Nudge seguido (YYYY-MM-DD) |

**Logica de Calculo do Streak:**
```
USUARIO SEGUE UM NUDGE
       |
       v
[Qual e a data de hoje? (YYYY-MM-DD)]
       |
       v
[Compara com last_nudge_date do usuario]
       |
  +----+----+----+
  |         |         |
  v         v         v
MESMO DIA   DIA       MAIS DE
(hoje)    ANTERIOR   1 DIA ATRAS
  |       (ontem)      |
  v         |          v
Ignora      v       current_streak = 1
(ja contou  current_streak += 1   (resetou)
 hoje)      |
            v
       [streak >= longest_streak?]
            |
       +----+----+
       SIM       NAO
        |          |
        v          v
  longest_streak  (mantem)
  = current_streak
```

**Regra de Reset:** Se o usuario nao segue nenhum Nudge por 1 dia completo (00:00 a 23:59), o streak reseta para 0.

#### 11.2.3 Badge "Biohacker da Semana"

| Criterio | Descricao |
|----------|-----------|
| **Condicao** | `current_streak >= 7` |
| **Badge** | "Biohacker da Semana" |
| **Bonus** | +500 Pontos de Energia (concedidos 1 vez por streak de 7) |
| **Visibilidade** | Badge visivel no perfil do usuario e no Dashboard do Gestor |
| **Recorrencia** | O badge e renovado a cada novo ciclo de 7 dias |

**Logica de Concessao:**
```
STREAK ATUALIZADO
       |
       v
[current_streak == 7?]
       |
  +----+----+
  SIM       NAO
  |          |
  v          v
[Ja recebeu badge  (continua)
 neste ciclo?]
  |
  +----+----+
  NAO       SIM
  |          |
  v          v
+500 pontos  (ignora)
Badge ativo
Salva em badges[]
```

**Ciclos de Badge:**
- Dias 1-7: Primeiro badge (se atingir 7)
- Dias 8-14: Segundo badge (se mantiver)
- O badge "expira" visualmente se o streak resetar

### 11.3 Novos Campos no Schema do Colaborador

```json
{
  "...campos existentes...",
  "energy_points": 0,
  "current_streak": 0,
  "longest_streak": 0,
  "last_nudge_date": null,
  "badges": [],
  "nudges_followed_today": 0,
  "is_premium": false,
  "plan": "free"
}
```

### 11.4 Nova Collection: `gamification_events`

```json
{
  "id": "uuid",
  "colaborador_id": "uuid",
  "event_type": "nudge_followed | streak_bonus | badge_earned | analysis_completed",
  "points_earned": 50,
  "nudge_id": "uuid (se aplicavel)",
  "streak_at_time": 3,
  "badge_name": "Biohacker da Semana (se aplicavel)",
  "created_at": "2026-02-01T14:30:00Z"
}
```

### 11.5 Novos Endpoints (Gamificacao)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/gamification/follow-nudge` | Marca Nudge como seguido, adiciona +50 pontos, atualiza streak | Sim |
| `GET` | `/api/gamification/stats` | Retorna pontos, streak atual, longest streak, badges | Sim |
| `GET` | `/api/gamification/leaderboard` | Top 10 colaboradores por pontos (anonimizado para nao-gestores) | Sim |
| `GET` | `/api/gamification/history?limit=20` | Historico de eventos de gamificacao | Sim |

**Body do `POST /api/gamification/follow-nudge`:**
```json
{
  "nudge_id": "uuid-da-analise",
  "analysis_id": "uuid-da-analise-que-gerou-o-nudge"
}
```

**Modelo de Resposta (`GamificationStats`):**
```json
{
  "energy_points": 750,
  "current_streak": 5,
  "longest_streak": 12,
  "badges": [
    {
      "name": "Biohacker da Semana",
      "earned_at": "2026-01-28T10:00:00Z",
      "is_active": true
    }
  ],
  "nudges_followed_today": 2,
  "rank_position": 3,
  "next_badge_in": 2
}
```

**Modelo de Resposta (`Leaderboard`):**
```json
{
  "period": "all_time",
  "entries": [
    {"rank": 1, "nome": "Maria S.", "energy_points": 2500, "current_streak": 14, "has_badge": true},
    {"rank": 2, "nome": "Joao P.", "energy_points": 1800, "current_streak": 5, "has_badge": false}
  ]
}
```

### 11.6 Impacto no Frontend

| Componente | Mudanca |
|------------|---------|
| **NudgeCard.js** | Botao "Iniciar Agora" chama `POST /api/gamification/follow-nudge`. Apos sucesso, exibe toast "+50 Pontos de Energia!" com animacao |
| **Navbar.js** | Exibe contador de Pontos de Energia e icone de chama (streak) ao lado do nome do usuario |
| **Dashboard.js** | Novo card compacto "Sua Energia" com pontos totais, streak e progresso ate proximo badge |
| **Profile.js** | Secao de badges com icones visuais. Badge "Biohacker da Semana" em destaque |
| **GestorDashboard.js** | Nova secao "Engajamento do Time" com leaderboard anonimizado e % de adesao a Nudges |

---

## 12. LIMITE DE ACESSO - PLANO FREE vs PREMIUM (B2C)

### 12.1 Visao Geral

Usuarios B2C (conta pessoal, sem dominio corporativo) possuem plano **Free** por padrao. O plano **Premium** desbloqueia funcionalidades avancadas. Usuarios **corporativos (B2B) nao sao afetados** - sempre tem acesso completo.

### 12.2 Regras de Negocio

| Funcionalidade | Free | Premium | Corporativo (B2B) |
|----------------|------|---------|-------------------|
| EnergyStatus (bolinha) | Sim | Sim | Sim |
| Analise biometrica basica | Sim (3/dia) | Ilimitada | Ilimitada |
| V-Score numerico | Sim | Sim | Sim |
| Heatmap 3D completo | Parcial (sem pulso) | Completo | Completo |
| Predicoes IA completas | Nao | Sim | Sim |
| Alerta Preditivo | Nao | Sim | Sim |
| Nudge detalhado da IA | Resumido (1 frase) | Completo | Completo |
| Historico completo | Ultimos 7 dias | Ilimitado | Ilimitado |
| Gamificacao | Sim | Sim | Sim |
| Conectar Wearables | 1 dispositivo | Ilimitado | Ilimitado |

### 12.3 Fluxo de Verificacao

```
USUARIO FAZ REQUISICAO
       |
       v
[Busca colaborador no banco]
       |
       v
[account_type == "corporate"?]
       |
  +----+----+
  SIM       NAO (personal)
  |              |
  v              v
ACESSO         [is_premium == true?]
TOTAL               |
              +----+----+
              SIM       NAO
              |          |
              v          v
           ACESSO     ACESSO
           TOTAL      LIMITADO
                     (aplica regras
                      da tabela acima)
```

### 12.4 Novos Campos

```json
{
  "is_premium": false,
  "plan": "free",
  "premium_since": null,
  "premium_expires": null
}
```

### 12.5 Novos Endpoints (Premium)

| Metodo | Rota | Descricao | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/billing/upgrade` | Atualiza plano para Premium (mock - prep. para Stripe) | Sim |
| `GET` | `/api/billing/plan` | Retorna plano atual e limites restantes | Sim |

**Modelo de Resposta (`PlanInfo`):**
```json
{
  "plan": "free",
  "is_premium": false,
  "account_type": "personal",
  "limits": {
    "analyses_today": 2,
    "analyses_limit": 3,
    "wearables_connected": 1,
    "wearables_limit": 1,
    "history_days": 7,
    "has_predictions": false,
    "has_detailed_nudge": false
  },
  "upgrade_url": null
}
```

---

## 13. MENSAGEM DE BOAS-VINDAS PERSONALIZADA (LOGIN CORPORATIVO)

### 13.1 Regra

Quando um usuario com `account_type == "corporate"` faz login, o frontend exibe um toast/banner:

```
"Bem-vindo ao VitalFlow, [PrimeiroNome]! Estamos cuidando da sua energia hoje na [NomeEmpresa]."
```

### 13.2 Fonte dos Dados

| Campo | Origem |
|-------|--------|
| `[PrimeiroNome]` | `colaborador.nome.split(' ')[0]` |
| `[NomeEmpresa]` | Busca em `corporate_domains` pelo `colaborador.domain` -> `company_name` |

### 13.3 Implementacao

**Backend:** O endpoint `POST /api/auth/login` ja retorna `account_type` e `domain`. Adicionar campo `company_name` na resposta de login para usuarios corporativos.

**Modelo de Resposta Atualizado (`AuthResponse`):**
```json
{
  "...campos existentes...",
  "account_type": "corporate",
  "domain": "brisanet.com.br",
  "company_name": "Brisanet"
}
```

**Frontend:** No `AuthContext.js`, apos login bem-sucedido, verificar `account_type === "corporate"` e exibir toast com a mensagem personalizada.

---

---

# PARTE III - GUIA DE PROXIMOS PASSOS

---

## 14. INTEGRACAO COM SMARTWATCHES REAIS

| Plataforma | API | Tipo |
|------------|-----|------|
| **Apple Watch** | HealthKit | SDK nativo iOS |
| **Wear OS** | Health Connect (Google) | SDK Android |
| **Garmin** | Garmin Connect API | REST API (OAuth 2.0) |
| **Fitbit** | Fitbit Web API | REST API (OAuth 2.0) |

**Fluxo de Integracao Real:**
```
SMARTWATCH
    |
    v
[SDK do dispositivo coleta BPM, HRV, Acelerometro]
    |
    v
[App Mobile envia para VitalFlow via POST /api/smartwatch/analyze]
    |
    v
[Backend processa: Detecta estresse/fadiga -> GPT-4o -> Notificacao]
    |
    v
[Resultado reflete no Dashboard em tempo real]
```

**O webhook (`POST /api/smartwatch/webhook`) ja esta preparado** para receber dados de dispositivos reais. Basta:
1. Substituir o `device_token` por autenticacao OAuth
2. Mapear os campos do SDK para o formato `SmartwatchData`

## 15. INTERFACE VISUAL (MOBILE/WEB)

**Recomendacao: React Native ou Flutter**

O backend ja esta 100% pronto como API REST. Para criar apps mobile nativos:

1. **React Native (Recomendado):** Reutiliza a logica de componentes React existente.
2. **Flutter:** Melhor performance nativa, mas requer reescrever toda a camada de UI.

**Passos para Mobile:**
- Trocar cookies HttpOnly por `Authorization: Bearer <token>` header (ja suportado pelo backend)
- Usar `AsyncStorage` (React Native) ou `SharedPreferences` (Flutter) para persistir tokens
- Implementar push notifications reais com Firebase Cloud Messaging
- Adaptar o HumanBodyHeatmap para SVG nativo ou canvas

## 16. ROADMAP COMPLETO

### Fase 2 - Gamificacao & Monetizacao (CONCLUIDA)

| # | Feature | Status |
|---|---------|--------|
| 1 | Gamificacao: Pontos de Energia (+50 por Nudge) | FEITO |
| 2 | Gamificacao: Sistema de Streaks (dias consecutivos) | FEITO |
| 3 | Gamificacao: Badge "Biohacker da Semana" (7d streak) | FEITO |
| 4 | Limite Free vs Premium (B2C) | FEITO |
| 5 | Mensagem de Boas-Vindas Corporativa | FEITO |
| 6 | Leaderboard (Top 10 pontos) | FEITO |

### Fase 3 - Producao & Integracao Real (PROXIMO)

| # | Feature | Prioridade | Esforco |
|---|---------|------------|---------|
| 7 | Relatorios PDF reais (reportlab) | P1 | Media |
| 8 | Push Notifications reais (FCM) | P2 | Alto |
| 9 | Integracao Google Calendar | P2 | Alto |
| 10 | Modo Offline (Service Worker) | P2 | Alto |
| 11 | Stripe para plano Premium (substituir mock) | P2 | Media |

### Fase 4 - Escala & Hardware

| # | Feature | Prioridade | Esforco |
|---|---------|------------|---------|
| 12 | Refatoracao server.py em APIRouters | P2 | Media |
| 13 | Redis cache (V-Score, EnergyStatus) | P2 | Media |
| 14 | Watch face nativa com V-Score | P3 | Alto |
| 15 | Dashboard analytics avancado | P3 | Alto |
| 16 | App Mobile nativo (React Native) | P3 | Muito Alto |

## 17. MELHORIAS DE INFRAESTRUTURA

| Area | Recomendacao |
|------|-------------|
| **Backend** | Refatorar `server.py` em multiplos arquivos com `APIRouter` (auth, analyze, smartwatch, dashboard, gamification) |
| **Banco** | Adicionar indices compostos em `smartwatch_analyses` (colaborador_id + timestamp) e `gamification_events` |
| **Cache** | Implementar Redis para caching de V-Score e EnergyStatus |
| **CI/CD** | Testes automatizados com pytest + GitHub Actions |
| **Seguranca** | Rate limiting, HTTPS obrigatorio, rotacao de JWT_SECRET |
| **Monitoramento** | Integrar Sentry para tracking de erros em producao |

---

**Documento Final Consolidado - VitalFlow v2.0**
**Motor de Analise Preditiva e Copiloto de Longevidade & Saude Mental**
**Fevereiro 2026 - Go-to-Market Ready**
