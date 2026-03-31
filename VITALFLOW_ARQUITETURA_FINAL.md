# VitalFlow - Resumo Final da Arquitetura
## Motor de Análise Preditiva e Copiloto de Longevidade & Saúde Mental

**Versão:** 1.0 (MVP Completo)
**Data:** Fevereiro 2026
**Stack:** React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

---

## 1. VISAO GERAL TECNICA

### 1.1 O que e o VitalFlow?
Um sistema de análise preditiva de saúde que recebe dados biométricos (HRV, BPM, Carga Cognitiva, Sono) e os transforma em:
- **V-Score** (0-100): Pontuação de vitalidade
- **Area Afetada**: Cérebro, Coração, Músculos, Sistema Digestivo
- **Status Visual**: Verde (Ótimo), Amarelo (Atenção), Vermelho (Alerta)
- **Nudge_Acao**: Tarefa rápida de 5 minutos gerada por IA (GPT-4o)

### 1.2 Funcionalidades Implementadas

| # | Funcionalidade | Descrição | Status |
|---|---|---|---|
| 1 | **Autenticação JWT** | Login/Registro com cookies HttpOnly, refresh token (7 dias) | Completo |
| 2 | **Filtro de Domínio Corporativo (Camaleão)** | Diferencia contas pessoais (B2C) de corporativas (B2B) pelo domínio do email | Completo |
| 3 | **Análise Biométrica com IA** | GPT-4o analisa HRV, BPM, Sono e Carga Cognitiva e retorna V-Score + diagnóstico | Completo |
| 4 | **Mapa Anatômico 3D (Heatmap)** | Silhueta humana com zonas de calor dinâmicas que pulsam conforme status | Completo |
| 5 | **EnergyStatus (Bolinha Visual)** | Indicador de cor pulsante (Verde/Amarelo/Vermelho) em tempo real na Navbar | Completo |
| 6 | **Conectar Dispositivos (Wearables)** | Tela de integração com Google Health Connect, Apple HealthKit, Garmin, Fitbit | Completo |
| 7 | **Webhook de Smartwatch** | Recebe dados BPM/HRV/Giroscópio via webhook; detecta estresse e fadiga | Completo |
| 8 | **Anonimização LGPD** | Dados de smartwatch analisados com UUID anônimo (sem rastreamento individual) | Completo |
| 9 | **Notificações Push Simuladas** | Alertas via Toast quando status crítico é detectado (prep. para FCM/OneSignal) | Completo |
| 10 | **Dashboard do Gestor** | Métricas anonimizadas do time: média de estresse, alertas, gráfico por horário | Completo |
| 11 | **IA Preditiva** | Analisa histórico de 7 dias e prevê próximo pico de estresse com 30min de antecedência | Completo |
| 12 | **Exportação de Relatório PDF** | Endpoint que retorna dados formatados para geração de PDF no frontend | Completo |
| 13 | **Perfil do Usuário** | Edição de nome, data de nascimento e foto de perfil | Completo |
| 14 | **Histórico de V-Score** | Gráfico de linha mostrando evolução temporal do V-Score | Completo |
| 15 | **Fallback sem IA** | Análise algorítmica local quando GPT-4o está indisponível | Completo |

---

## 2. ENDPOINTS DA API

### 2.1 Autenticação (`/api/auth/*`)

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/auth/register` | Cadastro de novo colaborador. Detecta automaticamente se é corporativo pelo domínio do email | Não |
| `POST` | `/api/auth/login` | Login. Retorna tokens JWT em cookies HttpOnly | Não |
| `POST` | `/api/auth/logout` | Logout. Remove cookies de token | Não |
| `GET` | `/api/auth/me` | Retorna dados do usuário logado (sem password_hash) | Sim |
| `PUT` | `/api/auth/profile` | Atualiza nome, data de nascimento e foto do perfil | Sim |
| `GET` | `/api/auth/check-domain?email=x@y.com` | Verifica se email pertence a domínio corporativo cadastrado | Não |

**Modelo de Resposta (`AuthResponse`):**
```json
{
  "id": "uuid",
  "nome": "João Silva",
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

### 2.2 Análise Biométrica (`/api/analyze`, `/api/history`)

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/analyze` | Envia dados biométricos e recebe análise completa da IA | Sim |
| `GET` | `/api/history?limit=30` | Histórico de análises do colaborador logado | Sim |

**Body do `POST /api/analyze`:**
```json
{
  "hrv": 45,
  "bpm": 95,
  "bpm_average": 70,
  "sleep_hours": 5.5,
  "cognitive_load": 8,
  "user_name": "João",
  "age": 32
}
```

**Modelo de Resposta (`AnalysisResponse`):**
```json
{
  "id": "uuid",
  "v_score": 42,
  "area_afetada": ["Cérebro", "Coração"],
  "status_visual": "Vermelho",
  "tag_rapida": "Overload Cognitivo",
  "causa_provavel": "HRV baixa (45ms) indica estresse do SN. BPM 35% acima da média.",
  "nudge_acao": "Faça 5 minutos de respiração 4-7-8 e beba 300ml de água gelada.",
  "timestamp": "2026-02-01T14:30:00Z",
  "colaborador_id": "uuid"
}
```

### 2.3 Smartwatch (`/api/smartwatch/*`)

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/smartwatch/analyze` | Análise em tempo real de dados do smartwatch + recomendação IA | Sim |
| `POST` | `/api/smartwatch/webhook?device_token=x` | Webhook para receber dados de smartwatches reais | Token |
| `GET` | `/api/smartwatch/history?limit=20` | Histórico de análises do smartwatch (anonimizado) | Sim |

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
  "ai_recommendation": "Título: Respiração Box\nAção: Inspire 4s, segure 4s, expire 4s...",
  "detected_at": "2026-02-01T15:00:00Z",
  "risk_level": "Alto",
  "push_notification_sent": true
}
```

### 2.4 Status de Energia (`/api/status/*`)

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `GET` | `/api/status/energy` | Status em tempo real (bolinha Verde/Amarelo/Vermelho) | Sim |

**Modelo de Resposta (`EnergyStatus`):**
```json
{
  "status": "Amarelo",
  "color_code": "#fbbf24",
  "label": "Atenção - Fadiga Detectada",
  "last_updated": "2026-02-01T15:00:00Z",
  "current_bpm": 85,
  "current_hrv": 42
}
```

### 2.5 IA Preditiva (`/api/predictive/*`)

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `GET` | `/api/predictive/alert` | Verifica se há padrão de estresse previsto e retorna alerta preventivo | Sim |

**Modelo de Resposta (com alerta):**
```json
{
  "has_alert": true,
  "alert": {
    "message": "João, seu histórico mostra picos de estresse às terças-feiras às 14h...",
    "predicted_time": "14:00",
    "minutes_until": 45,
    "confidence": 85.7,
    "pattern": "Pico de estresse detectado às terças-feiras às 14h (3x em 7 dias)"
  }
}
```

### 2.6 Dashboard do Gestor (`/api/dashboard/*`)

| Método | Rota | Descrição | Auth? | Permissão |
|--------|------|-----------|-------|-----------|
| `GET` | `/api/dashboard/metrics` | Métricas gerais: total colaboradores, média V-Score, distribuição | Sim | Gestor |
| `GET` | `/api/dashboard/team-stress` | Métricas de estresse do time (anonimizadas por LGPD) | Sim | Gestor |
| `GET` | `/api/dashboard/export-pdf` | Exporta dados do relatório para PDF | Sim | Gestor |
| `GET` | `/api/colaboradores?setor=SAC` | Lista colaboradores (filtro por setor) | Sim | Gestor |

**Modelo de Resposta (`TeamStressMetrics`):**
```json
{
  "period": "últimas 24h",
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

| Método | Rota | Descrição | Auth? |
|--------|------|-----------|-------|
| `POST` | `/api/wearables/connect` | Conecta um dispositivo wearable | Sim |
| `GET` | `/api/wearables` | Lista dispositivos conectados do colaborador | Sim |
| `DELETE` | `/api/wearables/{device_id}` | Desconecta um dispositivo | Sim |

---

## 3. LOGICA DE NEGOCIO

### 3.1 Diferenciação B2B vs B2C (Sistema Camaleão)

```
REGISTRO DE USUARIO
       |
       v
[Extrai domínio do email]  (ex: joao@brisanet.com.br -> "brisanet.com.br")
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
  (se Gestor)  - Análise IA
- Perfil
- Wearables
- Análise IA
```

**Domínios Corporativos Cadastrados (Seed):**
- `brisanet.com.br` -> Brisanet
- `vitalflow.com` -> VitalFlow
- `emergent.sh` -> Emergent

**Regra:** A diferenciação é AUTOMATICA. O sistema detecta pelo domínio do email no momento do registro. Não há tela de seleção "pessoal vs corporativo".

### 3.2 Cálculo do V-Score

A IA (GPT-4o) recebe os dados biométricos e retorna o V-Score aplicando estas regras:

| Parâmetro | Faixa Normal | Alerta | Crítico |
|-----------|-------------|--------|---------|
| HRV | > 50ms | 30-50ms | < 30ms |
| BPM vs Média | < 15% acima | 15-25% acima | > 25% acima |
| Sono | > 7h | 5-6h | < 5h |
| Carga Cognitiva | 0-5 | 6-7 | 8-10 (c/ sono < 6h) |

**Faixas do V-Score:**
- 80-100: Verde (Ótimo) -> Manter hábitos
- 50-79: Amarelo (Atenção) -> Intervenção leve
- 0-49: Vermelho (Alerta) -> Ação imediata necessária

### 3.3 Detecção de Estresse e Fadiga (Smartwatch)

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
"Alerta    [Acelerômetro ~0 por > 60min?]
 de           |
 Estresse"   +----+----+
  |          SIM       NAO
  |           |          |
  |           v          v
  |      "Sinal de   "Normal"
  |       Fadiga"
  |
  v
[Gera UUID anônimo (LGPD)]
  |
  v
[GPT-4o gera recomendação de Reset de Foco]
  |
  v
[Se Crítico: Dispara notificação push]
```

### 3.4 IA Preditiva (Prevenção de Estresse)

1. Busca últimas 7 dias de análises do smartwatch
2. Agrupa por dia da semana + hora (ex: "segunda_14h")
3. Calcula média de estresse por slot temporal
4. Se média >= 70/100 com >= 2 ocorrências, detecta padrão
5. Se o padrão está entre 30min e 2h no futuro, gera alerta preventivo via GPT-4o
6. Retorna mensagem personalizada com confiança baseada na frequência

### 3.5 Níveis de Acesso

| Nível | Acesso |
|-------|--------|
| **User** | Dashboard pessoal, análise biométrica, wearables, perfil |
| **Gestor** | Tudo do User + Dashboard do Gestor (métricas anonimizadas do time), exportação PDF, lista de colaboradores |

---

## 4. ARQUITETURA DE ARQUIVOS

```
/app/
├── backend/
│   ├── server.py                    # FastAPI (1702 linhas) - TODA lógica de negócio
│   │   ├── Modelos Pydantic         # (linhas 91-314) - 15+ modelos de dados
│   │   ├── Funções de IA            # (linhas 317-440) - Análise biométrica GPT-4o
│   │   ├── Smartwatch Engine        # (linhas 443-577) - Detecção estresse/fadiga
│   │   ├── Domain Functions         # (linhas 579-601) - Filtro domínio corporativo
│   │   ├── Predictive AI            # (linhas 604-735) - Padrões de estresse
│   │   ├── Push Notifications       # (linhas 738-797) - Notificações simuladas
│   │   ├── Auth Endpoints           # (linhas 800-1000) - Login/Register/Profile
│   │   ├── Analysis Endpoints       # (linhas 1002-1069) - Criar/Buscar análises
│   │   ├── Wearable Endpoints       # (linhas 1071-1142) - CRUD dispositivos
│   │   ├── Gestor Endpoints         # (linhas 1144-1490) - Métricas/Time/Export
│   │   ├── Smartwatch Endpoints     # (linhas 1492-1586) - Analyze/Webhook/History
│   │   └── Startup/Seed             # (linhas 1612-1698) - Indexes/Admin/Domains
│   ├── smartwatch_simulator.py      # Script de teste do webhook (4 cenários)
│   ├── requirements.txt             # 27 dependências Python
│   └── .env                         # MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY, etc.
│
├── frontend/
│   ├── package.json                 # React 19 + 40+ dependências
│   ├── src/
│   │   ├── App.js                   # Roteamento com React Router v7
│   │   ├── contexts/
│   │   │   └── AuthContext.js       # Estado global de autenticação
│   │   ├── components/
│   │   │   ├── HumanBodyHeatmap.js  # Silhueta 3D com mapa de calor animado
│   │   │   ├── EnergyStatus.js      # Bolinha pulsante Verde/Amarelo/Vermelho
│   │   │   ├── VScoreDisplay.js     # Display grande do V-Score com animação
│   │   │   ├── AIAnalysis.js        # Card de tag + causa provável
│   │   │   ├── NudgeCard.js         # Card de ação imediata (5 min)
│   │   │   ├── BiometricForm.js     # Modal de entrada de dados biométricos
│   │   │   ├── HistoryChart.js      # Gráfico de linha (recharts)
│   │   │   ├── Navbar.js            # Navegação + EnergyStatus + Dropdown
│   │   │   ├── ProtectedRoute.js    # HOC de proteção de rotas
│   │   │   └── ui/                  # Componentes Shadcn UI (20+ componentes)
│   │   └── pages/
│   │       ├── Dashboard.js         # Tela principal (V-Score + Heatmap + Nudge)
│   │       ├── GestorDashboard.js   # Painel do Gestor (gráficos + métricas)
│   │       ├── ConnectDevices.js    # Integração com wearables (4 providers)
│   │       ├── Profile.js           # Edição de perfil + foto
│   │       ├── Login.js             # Tela de login
│   │       └── Register.js          # Tela de cadastro
│   └── .env                         # REACT_APP_BACKEND_URL
│
└── memory/
    ├── PRD.md                       # Documento de requisitos do produto
    └── test_credentials.md          # Credenciais de teste
```

---

## 5. BANCO DE DADOS (MongoDB)

### 5.1 Collections

| Collection | Descrição | Documentos Típicos |
|------------|-----------|-------------------|
| `colaboradores` | Usuários do sistema | ~10-1000 |
| `analyses` | Análises biométricas (V-Score) | ~100-10000 |
| `smartwatch_analyses` | Dados de smartwatch processados | ~1000-100000 |
| `wearable_devices` | Dispositivos conectados | ~10-1000 |
| `corporate_domains` | Domínios corporativos cadastrados | ~3-50 |
| `predictive_alerts` | Alertas preditivos gerados | ~10-1000 |
| `notifications` | Histórico de notificações push | ~100-10000 |

### 5.2 Schema: Colaborador
```json
{
  "id": "uuid",
  "nome": "string",
  "email": "string (unique, indexed)",
  "password_hash": "string (bcrypt)",
  "data_nascimento": "string (ISO date)",
  "foto_url": "string | null",
  "setor": "Administrativo | SAC | Logística | Operacional",
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

## 6. INTEGRAÇÕES DE TERCEIROS

| Serviço | Uso | Chave |
|---------|-----|-------|
| **Emergent LLM (GPT-4o)** | Análise biométrica, geração de Nudges, recomendações de Reset de Foco, alertas preditivos | `EMERGENT_LLM_KEY` (via `emergentintegrations`) |

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

| Conta | Email | Senha | Tipo | Nível |
|-------|-------|-------|------|-------|
| Admin | `admin@vitalflow.com` | `Admin123!@#` | Personal | Gestor |

Para criar conta corporativa, registre com email `@brisanet.com.br`, `@vitalflow.com` ou `@emergent.sh`.

---

## 8. GUIA DE PROXIMOS PASSOS

### 8.1 Interface Visual (Mobile/Web)

**Recomendação: React Native ou Flutter**

O backend já está 100% pronto como API REST. Para criar apps mobile nativos:

1. **React Native (Recomendado):** Reutiliza a lógica de componentes React existente. Os mesmos contextos (`AuthContext`) e chamadas Axios funcionam com mínimas adaptações.

2. **Flutter:** Melhor performance nativa, mas requer reescrever toda a camada de UI.

**Passos para Mobile:**
- Trocar cookies HttpOnly por `Authorization: Bearer <token>` header (já suportado pelo backend - ver linha 64 do `server.py`)
- Usar `AsyncStorage` (React Native) ou `SharedPreferences` (Flutter) para persistir tokens
- Implementar push notifications reais com Firebase Cloud Messaging (o backend já tem a estrutura de notificação pronta)
- Adaptar o HumanBodyHeatmap para SVG nativo ou canvas

### 8.2 Integração com Smartwatches Reais

| Plataforma | API | Tipo |
|------------|-----|------|
| **Apple Watch** | HealthKit | SDK nativo iOS |
| **Wear OS** | Health Connect (Google) | SDK Android |
| **Garmin** | Garmin Connect API | REST API (OAuth 2.0) |
| **Fitbit** | Fitbit Web API | REST API (OAuth 2.0) |

**Fluxo de Integração Real:**
```
SMARTWATCH
    |
    v
[SDK do dispositivo coleta BPM, HRV, Acelerômetro]
    |
    v
[App Mobile envia para VitalFlow via POST /api/smartwatch/analyze]
    |
    v
[Backend processa: Detecta estresse/fadiga -> GPT-4o -> Notificação]
    |
    v
[Resultado reflete no Dashboard em tempo real]
```

**O webhook (`POST /api/smartwatch/webhook`) já está preparado** para receber dados de dispositivos reais. Basta:
1. Substituir o `device_token` por autenticação OAuth
2. Mapear os campos do SDK para o formato `SmartwatchData`

### 8.3 Funcionalidades Futuras Planejadas

| Prioridade | Feature | Descrição |
|------------|---------|-----------|
| P0 | **Gamificação (Pontos de Energia)** | +50 pontos ao seguir Nudge da IA. Ranking e recompensas |
| P0 | **Plano Free vs Premium (B2C)** | Free: apenas EnergyStatus. Premium: predições completas da IA |
| P1 | **Boas-Vindas Corporativas** | "Bem-vindo ao VitalFlow, [Nome]! Cuidando da sua energia na [Empresa]" |
| P1 | **Relatórios PDF reais** | Integrar `reportlab` ou `weasyprint` para PDFs formatados |
| P2 | **Push Notifications reais** | Firebase Cloud Messaging / OneSignal |
| P2 | **Integração com calendário** | Correlacionar picos de estresse com reuniões do Google Calendar |
| P2 | **Modo Offline** | Service Worker + IndexedDB para funcionar sem internet |
| P3 | **Wearable SDK nativo** | Watch face dedicada com V-Score em tempo real |

### 8.4 Melhorias de Infraestrutura

| Area | Recomendação |
|------|-------------|
| **Backend** | Refatorar `server.py` em múltiplos arquivos com `APIRouter` (auth, analyze, smartwatch, dashboard) |
| **Banco** | Adicionar índices compostos em `smartwatch_analyses` (colaborador_id + timestamp) |
| **Cache** | Implementar Redis para caching de V-Score e EnergyStatus |
| **CI/CD** | Testes automatizados com pytest + GitHub Actions |
| **Segurança** | Rate limiting, HTTPS obrigatório, rotação de JWT_SECRET |
| **Monitoramento** | Integrar Sentry para tracking de erros em produção |

---

## 9. CODIGO-FONTE COMPLETO

O código-fonte consolidado está organizado da seguinte forma:

### Backend Principal: `/app/backend/server.py`

**Estrutura do arquivo (1702 linhas):**

```
Linhas 1-28    : Imports e conexão MongoDB
Linhas 29-85   : Autenticação (hash, JWT, helper get_current_colaborador)
Linhas 86-314  : Modelos Pydantic (15+ modelos)
Linhas 317-440 : Função analyze_biometrics() - Motor de IA principal
Linhas 443-577 : Funções de Smartwatch (detecção de estresse/fadiga)
Linhas 579-601 : Verificação de domínio corporativo
Linhas 604-735 : IA Preditiva (análise de padrões de estresse)
Linhas 738-797 : Notificações Push simuladas
Linhas 800-1000: Endpoints de Autenticação (register, login, logout, me, profile)
Linhas 1002-1069: Endpoints de Análise (create, history)
Linhas 1071-1142: Endpoints de Wearables (connect, list, disconnect)
Linhas 1144-1321: Endpoints do Dashboard Gestor (metrics, team-stress, export-pdf)
Linhas 1323-1586: Endpoints de Smartwatch (analyze, webhook, history, energy)
Linhas 1588-1702: CORS, Startup (seed admin, seed domínios), Shutdown
```

### Frontend Principal: 12 arquivos React

| Arquivo | Função | Linhas |
|---------|--------|--------|
| `App.js` | Roteamento e providers | 61 |
| `AuthContext.js` | Estado global de auth | 115 |
| `Dashboard.js` | Tela principal | 201 |
| `GestorDashboard.js` | Painel do gestor | 260 |
| `ConnectDevices.js` | Integração wearables | 284 |
| `Profile.js` | Edição de perfil | 244 |
| `Login.js` | Tela de login | 127 |
| `Register.js` | Tela de cadastro | 199 |
| `HumanBodyHeatmap.js` | Heatmap 3D animado | 346 |
| `EnergyStatus.js` | Bolinha de status | 102 |
| `VScoreDisplay.js` | Display do V-Score | 118 |
| `BiometricForm.js` | Modal de entrada de dados | 198 |
| `NudgeCard.js` | Card de ação imediata | 90 |
| `AIAnalysis.js` | Card de diagnóstico IA | 79 |
| `HistoryChart.js` | Gráfico de evolução | 100 |
| `Navbar.js` | Navegação principal | 138 |

---

## 10. VARIAVEIS DE AMBIENTE

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

## 11. COMO EXECUTAR

### Desenvolvimento Local
```bash
# Backend
cd /app/backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend
cd /app/frontend
yarn install
yarn start
```

### Produção (Emergent Platform)
```bash
# O supervisor gerencia ambos os serviços automaticamente
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### Testar Smartwatch
```bash
cd /app/backend
python smartwatch_simulator.py
```

---

**Documento gerado automaticamente pelo VitalFlow Architecture Analyzer**
**VitalFlow v1.0 - Motor de Análise Preditiva e Copiloto de Longevidade**
