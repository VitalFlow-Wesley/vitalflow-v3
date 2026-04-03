# VitalFlow - Product Requirements Document (PRD)

## Status: v2.7 (Abril 2026) - Premium Trial + Limpeza Profile + Botao Gestao

## Stack: React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

## Arquitetura Backend (Refatorada)
```
/app/backend/
  server.py          (176 linhas - setup, CORS, startup)
  database.py        (MongoDB connection)
  auth_utils.py      (JWT/password helpers)
  models.py          (Pydantic models com premium_expires_at)
  services/
    ai_service.py    (GPT-4o biometrics + smartwatch)
    domain_service.py (Corporate domain + stress patterns)
    google_fit_service.py (OAuth 2.0 Google Fit)
  routes/
    auth.py          (register com trial, login, forgot-password, etc)
    analysis.py      (analyze, history)
    dashboard.py     (gestor: metrics, team, add-employee, PDF)
    smartwatch.py    (analyze, webhook, history, energy)
    gamification.py  (nudge, stats, leaderboard, billing com auto-expire)
    health.py        (trend Lei 14.831, predictive alert)
    wearables.py     (connect, google-fit real, oauth mock)
```

## Funcionalidades Implementadas

### MVP Core
- [x] Auth JWT + Dominio Corporativo (B2B/B2C)
- [x] Analise Biometrica GPT-4o (V-Score + Nudge)
- [x] StatusOrb + MetricBars + EnergyStatus

### Premium Trial 7 Dias (v2.7)
- [x] Todo novo cadastro comeca com is_premium=true
- [x] Campo premium_expires_at = 7 dias apos registro
- [x] Endpoint /api/billing/plan auto-reverte para Free quando trial expira
- [x] AuthResponse retorna premium_expires_at

### Gamificacao + Premium
- [x] Pontos de Energia + Streaks + Badge Biohacker
- [x] Trava Premium com auto-expire do trial

### Gestor + Lei 14.831
- [x] Painel Gestor (LGPD) + Tendencia 7 dias
- [x] PDF via ReportLab + Filtros de periodo

### Permissoes (v2.3)
- [x] Esqueci minha senha + campo corporativo read-only

### Onboarding + Sync Feedback (v2.5)
- [x] Tour 4 passos + Estado "Aguardando sincronizacao"

### Google Fit (v2.6)
- [x] OAuth 2.0 real com credenciais configuradas

### Ajustes v2.7 - Abril 2026
- [x] Botao "Gestao" navega internamente para /gestor (removido link externo quebrado)
- [x] Profile: campos Setor e Cargo REMOVIDOS (apenas Nome, Data Nascimento, Email, Nivel de Acesso)
- [x] Premium Trial 7 dias em todo novo cadastro

### Testes: 9/9 backend + 15/15 frontend (iteration 9) = 100%

## Backlog
- [ ] P1: Stripe real (substituir mock Premium)
- [ ] P1: Push FCM real
- [ ] P1: Sincronizacao periodica Google Fit
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real
