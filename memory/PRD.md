# VitalFlow - Product Requirements Document (PRD)

## Status: v2.6 (Abril 2026) - Google Fit OAuth Real Ativado

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
    google_fit_service.py (OAuth 2.0 Google Fit - ATIVADO)
  routes/
    auth.py          (register, login, logout, me, profile, forgot-password)
    analysis.py      (analyze, history)
    dashboard.py     (metrics, team-overview, team-stress, add-employee, export-pdf)
    smartwatch.py    (analyze, webhook, history, energy-status)
    gamification.py  (follow-nudge, stats, leaderboard, billing)
    health.py        (trend Lei 14.831, predictive alert)
    wearables.py     (connect, list, disconnect, oauth, google-fit real)
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

### Gestor + Lei 14.831
- [x] Painel Gestor (LGPD) + Tendencia 7 dias
- [x] PDF via ReportLab + Filtros de periodo

### Permissoes (v2.3)
- [x] Profile campos corporativos read-only + Esqueci minha senha

### Refatoracao (v2.4)
- [x] server.py dividido em 13 arquivos modulares

### Onboarding + Sync Feedback (v2.5)
- [x] Tour 4 passos + Estado "Aguardando sincronizacao"
- [x] Botao Navbar renomeado "Gestao"

### Google Fit Real (v2.6) - Abril 2026
- [x] Credenciais OAuth 2.0 configuradas no .env
- [x] Fluxo real: usuario clica Conectar -> Google login -> autoriza -> callback -> dados
- [x] Frontend detecta se Google Fit esta configurado e redireciona para OAuth real
- [x] Callback salva tokens + sincroniza dados biometricos
- [x] Feedback visual apos retorno do callback

## Backlog
- [ ] P1: Sincronizacao periodica Google Fit (cron/scheduled)
- [ ] P1: Stripe real (substituir mock Premium)
- [ ] P1: Push FCM real
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real

## Nota sobre Google Fit
O app esta em modo "Teste" no Google Cloud Console. Apenas emails adicionados
como usuarios de teste podem autorizar. Para liberar para todos, submeter
para verificacao do Google (2-6 semanas).
