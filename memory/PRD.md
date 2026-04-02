# VitalFlow - Product Requirements Document (PRD)

## Status: v2.4 (Abril 2026) - Backend Refatorado + Botao Painel Administrativo

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
  routes/
    auth.py          (register, login, logout, me, profile, forgot-password)
    analysis.py      (analyze, history)
    dashboard.py     (metrics, team-overview, team-stress, add-employee, export-pdf)
    smartwatch.py    (analyze, webhook, history, energy-status)
    gamification.py  (follow-nudge, stats, leaderboard, billing)
    health.py        (trend Lei 14.831, predictive alert)
    wearables.py     (connect, list, disconnect, oauth callback)
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
- [x] Profile: campos Setor, Cargo, Nivel de Acesso read-only com cadeado para corporativos
- [x] Register: simplificado para contas pessoais (B2C)
- [x] Login: "Esqueci minha senha" com geracao de senha temporaria
- [x] GestorDashboard: modal com campo Nivel de Acesso (User/Gestor)

### Refatoracao Backend (v2.4) - Abril 2026
- [x] server.py dividido de 2534 linhas para 13 arquivos modulares
- [x] APIRouter pattern em routes/
- [x] Services isolados (AI, Domain, Push)
- [x] Models centralizados em models.py
- [x] Botao "Painel Administrativo" visivel para Gestores (link externo https://vitalflow.ia.br/gestor)

### Testes: 24/24 backend + 16/16 frontend (iteration 7) = 100%

## Backlog
- [ ] P0: Onboarding Interativo (Aha moment nos primeiros 60s)
- [ ] P1: Stripe real, Push FCM, Google Fit/Apple Health real
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real
