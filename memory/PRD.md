# VitalFlow - Product Requirements Document (PRD)

## Status: v3.0 (Abril 2026) - Compliance LGPD + B2B Hibrido + Background Sync

## Stack: React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

## Arquitetura Backend (Modularizada)
```
/app/backend/
  server.py          (setup, CORS, startup)
  database.py        (MongoDB connection)
  auth_utils.py      (JWT/password helpers)
  models.py          (Pydantic models)
  services/
    ai_service.py    (GPT-4o biometrics + smartwatch)
    domain_service.py (Corporate domain + stress patterns)
    google_fit_service.py (OAuth 2.0 Google Fit + token refresh)
  routes/
    auth.py          (register, login, first-access, LGPD accept)
    analysis.py      (analyze, history)
    dashboard.py     (gestor: metrics, team, add-employee B2B hibrido, PDF, setores)
    smartwatch.py    (analyze, webhook, history, energy)
    gamification.py  (nudge, stats, leaderboard, billing com auto-expire)
    health.py        (trend + medical_alert, predictive alert, personal report/PDF)
    wearables.py     (connect, google-fit real, oauth mock, sync background)
```

## Funcionalidades Implementadas

### MVP Core
- [x] Auth JWT + Dominio Corporativo (B2B/B2C)
- [x] Analise Biometrica GPT-4o (V-Score + Nudge)
- [x] StatusOrb + MetricBars + EnergyStatus

### Compliance LGPD + Medico (v3.0)
- [x] FirstAccessFlow: troca de senha obrigatoria + aceite LGPD para usuarios RH
- [x] Termos de privacidade no primeiro acesso
- [x] Linguagem segura: "Indicadores de Bem-estar" (sem "diagnostico"/"tratamento")
- [x] Disclaimer medico em todos os fluxos

### B2B Hibrido (v3.0)
- [x] RH pode adicionar emails pessoais (@gmail) ao modo corporativo
- [x] Conversao automatica: usuario personal vira corporate quando adicionado por RH
- [x] Campos Profile bloqueados para B2B (setor/email read-only)

### Filtro de Setor no Gestor (v3.0)
- [x] Endpoint /api/dashboard/setores lista setores distintos
- [x] Dropdown de setor no GestorDashboard
- [x] Team-overview filtra por setor selecionado
- [x] Botao "Limpar" para resetar filtro

### Google Fit Persistente (v3.0)
- [x] Tokens OAuth salvos no MongoDB (wearable_tokens)
- [x] Provider unificado "google_health_connect" (backend + frontend)
- [x] Endpoint /api/wearables/sync usa tokens salvos
- [x] refresh_access_token no google_fit_service

### Background Sync (v3.0)
- [x] Timer de 30 min no Dashboard (backgroundSync)
- [x] Sync silencioso via /api/wearables/sync
- [x] Toast de confirmacao quando dados sincronizados

### Alerta Medico (v3.0)
- [x] medical_alert no endpoint /api/health/trend
- [x] Popup de consulta medica quando V-Score < 40 por 3+ dias
- [x] Dismiss diario (localStorage)
- [x] Disclaimer de ferramenta de apoio

### Modo Offline + Conexao (v2.5+)
- [x] ConnectionStatus (bolinha verde/vermelha) na Navbar
- [x] Fila offline (localStorage) com flush automatico ao reconectar
- [x] Ping interval de 15s

### Premium Trial 7 Dias
- [x] Ativacao no primeiro vinculo com wearable
- [x] Auto-reverte para Free quando trial expira
- [x] Trava PDF para conta Free pessoal

### Gamificacao
- [x] Pontos de Energia + Streaks + Badge Biohacker
- [x] Leaderboard Top 10

### Gestor + Lei 14.831
- [x] Painel Gestor (LGPD) + Tendencia
- [x] PDF via ReportLab + Filtros de periodo + setor

### Onboarding
- [x] Tour 4 passos no primeiro acesso
- [x] Estado "Aguardando sincronizacao" quando sem dados

### ZIP
- [x] Arquivo /app/vitalflow_v3.0.zip gerado (141KB)

### Testes: Iteracao 11 - Backend 18/18 (100%) + Frontend 20/20 (100%)

## Backlog
- [ ] P1: Stripe real (substituir mock Premium)
- [ ] P1: Push FCM real
- [ ] P1: App Desktop (Electron/Tauri) para Brisanet
- [ ] P2: Login QR Code (estilo WhatsApp Web)
- [ ] P2: Biometria Comportamental (fadiga via IA local)
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real
