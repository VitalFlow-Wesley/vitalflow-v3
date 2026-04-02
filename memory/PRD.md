# VitalFlow - Product Requirements Document (PRD)

## Status: v2.5 (Abril 2026) - Onboarding + Sync Feedback + Google Fit Preparado

## Stack: React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

## Arquitetura Backend (Refatorada)
```
/app/backend/
  server.py          (176 linhas - setup, CORS, startup)
  database.py        (MongoDB connection)
  auth_utils.py      (JWT/password helpers)
  models.py          (Todos os modelos Pydantic)
  services/
    ai_service.py    (Analise biometrica + smartwatch via GPT-4o)
    domain_service.py (Dominio corporativo + stress patterns + push)
    google_fit_service.py (OAuth 2.0 Google Fit - PREPARADO)
  routes/
    auth.py          (register, login, logout, me, profile, forgot-password)
    analysis.py      (analyze, history)
    dashboard.py     (metrics, team-overview, team-stress, add-employee, export-pdf)
    smartwatch.py    (analyze, webhook, history, energy-status)
    gamification.py  (follow-nudge, stats, leaderboard, billing)
    health.py        (trend Lei 14.831, predictive alert)
    wearables.py     (connect, list, disconnect, oauth, google-fit/status/auth/callback)
```

## Funcionalidades Implementadas

### MVP Core
- [x] Auth JWT + Dominio Corporativo (B2B/B2C)
- [x] Analise Biometrica GPT-4o (V-Score + Nudge)
- [x] StatusOrb + MetricBars + EnergyStatus
- [x] Webhook Smartwatch + LGPD

### Gamificacao + Premium
- [x] Pontos de Energia + Streaks + Badge Biohacker
- [x] Trava Premium (B2C Free vs Premium)
- [x] Boas-Vindas Corporativas

### Gestor + Lei 14.831 + Wearables
- [x] Painel Gestor com V-Score agregado (LGPD)
- [x] Tendencia 7 dias + Flag Lei 14.831
- [x] Fluxo OAuth simulado para wearables

### UX Polish (v2.2)
- [x] Automacao total: botao manual removido
- [x] ConnectionStatus (Online/Reconnecting/Offline)
- [x] Cache offline (LocalStorage) + Auto-sync
- [x] GestorDashboard desktop-only

### Permissoes e Restricoes (v2.3)
- [x] Profile: campos corporativos read-only com cadeado
- [x] Register: simplificado B2C
- [x] Login: "Esqueci minha senha"
- [x] GestorDashboard: modal com campo Nivel de Acesso

### Refatoracao Backend (v2.4)
- [x] server.py dividido em 13 arquivos modulares
- [x] APIRouter pattern + Services isolados

### Onboarding + Sync Feedback + Google Fit (v2.5) - Abril 2026
- [x] Botao Navbar renomeado para "Gestao"
- [x] Onboarding Interativo: 4 passos (Welcome, V-Score, Gamificacao, Conectar)
- [x] Tour usa localStorage para nao repetir
- [x] Passo final redireciona para /devices
- [x] Dashboard: estado "Aguardando sincronizacao" ou "Conecte um dispositivo"
- [x] HistoryChart: estado vazio com icone pulsante + CTA
- [x] Google Fit: arquitetura OAuth preparada (env vars + rotas + service)
- [x] Endpoint /api/wearables/google-fit/status para verificar configuracao

### Testes: 8/8 backend + 16/16 frontend (iteration 8) = 100%

## Backlog
- [ ] P1: Ativar Google Fit (credenciais OAuth do Google Cloud Console)
- [ ] P1: Stripe real (substituir mock Premium)
- [ ] P1: Push FCM real
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real

## Integracoes Preparadas (Aguardando Credenciais)
- Google Fit: Adicionar GOOGLE_FIT_CLIENT_ID e GOOGLE_FIT_CLIENT_SECRET no .env
