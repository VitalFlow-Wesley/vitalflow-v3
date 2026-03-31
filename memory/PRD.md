# VitalFlow - Product Requirements Document (PRD)

## Problema Original
Motor de analise preditiva e copiloto de longevidade e saude mental corporativo. Recebe dados biometricos (HRV, BPM, Carga Cognitiva/Sono) e transforma em V-Score (0-100), identificando Area Afetada, Status Visual e gerando Nudges de acao via IA.

## Stack Tecnico
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend:** FastAPI, Python, Motor (MongoDB async), PyJWT, bcrypt
- **IA:** GPT-4o via Emergent LLM Key (emergentintegrations)
- **Banco:** MongoDB

## Funcionalidades Implementadas (MVP 1.0) - Fev/2026
- [x] Autenticacao JWT (Login/Register/Logout/Profile)
- [x] Filtro de Dominio Corporativo (B2B vs B2C automatico)
- [x] Analise Biometrica com GPT-4o (V-Score + Nudge)
- [x] Mapa Anatomico 3D (Heatmap com zonas pulsantes)
- [x] EnergyStatus (bolinha visual em tempo real)
- [x] Conectar Dispositivos (4 providers: Google, Apple, Garmin, Fitbit)
- [x] Webhook de Smartwatch (deteccao estresse/fadiga)
- [x] Anonimizacao LGPD
- [x] Notificacoes Push simuladas (toasts)
- [x] Dashboard do Gestor (metricas anonimizadas)
- [x] IA Preditiva (previsao de estresse com 30min antecedencia)
- [x] Exportacao de relatorio PDF (dados JSON)
- [x] Historico de V-Score (grafico de linha)
- [x] Fallback sem IA (analise algoritmica local)
- [x] Documento de Arquitetura Final v1.1 (com Gamificacao spec)

## Backlog (Proximos Passos)
### P0 - Fase 2: Gamificacao & Monetizacao
- [ ] Pontos de Energia (+50 por Nudge, +10 por analise, +100 streak 3d, +500 streak 7d)
- [ ] Sistema de Streaks (dias consecutivos seguindo Nudges)
- [ ] Badge "Biohacker da Semana" (streak >= 7 dias, visivel no Gestor Dashboard)
- [ ] Leaderboard (Top 10 por pontos)
- [ ] Limite Free vs Premium (B2C) - Free: 3 analises/dia, sem predicoes IA

### P1
- [ ] Mensagem de Boas-Vindas Personalizada (Login Corporativo)
- [ ] Relatorios PDF reais (reportlab/weasyprint)

### P2
- [ ] Push Notifications reais (FCM/OneSignal)
- [ ] Integracao com Google Calendar
- [ ] Modo Offline (Service Worker)
- [ ] Stripe para plano Premium
- [ ] Refatoracao do server.py em APIRouters separados

### P3
- [ ] Watch face nativa com V-Score
- [ ] Dashboard analytics avancado
- [ ] App Mobile nativo (React Native)
