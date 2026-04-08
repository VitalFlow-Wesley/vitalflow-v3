# VitalFlow - Product Requirements Document (PRD)

## Status: v3.1 (Abril 2026) - Real Data Integration + Deploy 24/7

## Stack: React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

## Arquitetura Backend (Modularizada)
```
/app/backend/
  server.py, database.py, auth_utils.py, models.py
  services/
    ai_service.py    (GPT-4o + classify_activity + calculate_sleep_recovery + fallback)
    domain_service.py (Corporate domain + stress patterns)
    google_fit_service.py (OAuth 2.0 + fetch_biometrics horario + refresh_token)
  routes/
    auth.py, analysis.py, dashboard.py, smartwatch.py
    gamification.py, health.py, wearables.py
```

## Deploy
```
/app/
  Dockerfile          (multi-stage: Node build + Python runtime + nginx)
  render.yaml         (Render.com blueprint)
  docker-compose.yml  (dev local com MongoDB)
  backend/Dockerfile.dev, frontend/Dockerfile.dev
```

## Funcionalidades Implementadas

### v1-v2 (MVP Core)
- [x] Auth JWT + Dominio Corporativo (B2B/B2C)
- [x] Analise Biometrica GPT-4o (V-Score + Nudge)
- [x] StatusOrb + MetricBars + EnergyStatus
- [x] Gamificacao (Pontos, Streaks, Badges)
- [x] Gestor Dashboard + Lei 14.831
- [x] Premium Trial 7 dias + Trava PDF
- [x] Onboarding Interativo
- [x] ConnectionStatus (bolinha verde/vermelha)

### v3.0 (Compliance + B2B Hibrido)
- [x] FirstAccessFlow LGPD + troca senha obrigatoria
- [x] Linguagem segura ("Indicadores de Bem-estar")
- [x] B2B Hibrido (emails pessoais convertidos para corporate)
- [x] Filtro de Setor no GestorDashboard
- [x] Persistencia OAuth Google Fit (tokens no MongoDB)
- [x] Background Sync (timer 30min)
- [x] Alerta Medico (V-Score < 40 por 3+ dias)

### v3.1 (Real Data Integration) - CURRENT
- [x] Extracao real de BPM/Steps/Sleep com granularidade HORARIA
- [x] Sleep Quality Breakdown (deep/light/REM)
- [x] Deteccao de Exercicio: BPM alto + Steps altos = Saude (nao Estresse)
- [x] classify_activity(): crossref BPM x Steps por hora
- [x] Calculo de Recuperacao por Sono: sleep < 6h = limiares mais rigorosos
- [x] calculate_sleep_recovery(): fator 0.5-1.0 ajusta bpm_stress_threshold
- [x] Auto-analise no Sync: dados reais disparam analise GPT-4o automaticamente
- [x] Card "Sensores Reais" no Dashboard (BPM, Passos, Sono, Recuperacao)
- [x] Dockerfile multi-stage (Node build + Python + nginx)
- [x] render.yaml (Render.com blueprint com envVars)
- [x] docker-compose.yml (dev local com MongoDB)
- [x] ZIP v3.1 gerado: /app/vitalflow_v3.1.zip (176KB)

### Testes: Iteracao 12 - Backend 28/28 (100%) + Frontend 14/14 (100%)

## Backlog
- [ ] P1: Stripe real (gateway de pagamento Pix/checkout)
- [ ] P1: Push FCM real
- [ ] P1: App Desktop (Electron/Tauri) para Brisanet
- [ ] P2: Login QR Code (estilo WhatsApp Web)
- [ ] P2: Biometria Comportamental (fadiga via IA local)
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real
