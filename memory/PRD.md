# VitalFlow - Product Requirements Document (PRD)

## Problema Original
Motor de analise preditiva e copiloto de longevidade e saude mental corporativo. Recebe dados biometricos (HRV, BPM, Carga Cognitiva/Sono) e transforma em V-Score (0-100), identificando Area Afetada, Status Visual e gerando Nudges de acao via IA.

## Stack Tecnico
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend:** FastAPI, Python, Motor (MongoDB async), PyJWT, bcrypt
- **IA:** GPT-4o via Emergent LLM Key (emergentintegrations)
- **Banco:** MongoDB

## Funcionalidades Implementadas (v2.0 - Go-to-Market) - Fev/2026

### MVP Core
- [x] Autenticacao JWT (Login/Register/Logout/Profile)
- [x] Filtro de Dominio Corporativo (B2B vs B2C automatico)
- [x] Analise Biometrica com GPT-4o (V-Score + Nudge)
- [x] StatusOrb (esfera abstrata com pulsacao variavel)
- [x] MetricBars (barras de progresso biometricas)
- [x] EnergyStatus (bolinha visual em tempo real)
- [x] Conectar Dispositivos (4 providers)
- [x] Webhook de Smartwatch + LGPD
- [x] Notificacoes Push simuladas
- [x] Dashboard do Gestor (metricas anonimizadas)
- [x] IA Preditiva (previsao de estresse 30min)
- [x] Exportacao de relatorio PDF
- [x] UI Minimalista (sem imagem anatomica)

### Fase 2 (Gamificacao + Monetizacao)
- [x] Pontos de Energia (+50 por Nudge, bonus streak)
- [x] Sistema de Streaks (dias consecutivos)
- [x] Badge "Biohacker da Semana" (7 dias streak)
- [x] Leaderboard (Top 10 por pontos)
- [x] Trava Premium (B2C Free sem predicoes IA)
- [x] Mensagem de Boas-Vindas Corporativa

### Testes
- [x] 15/15 testes backend passando
- [x] 13/13 testes frontend passando

## Backlog (Proximos Passos)
### P1 - Fase 3: Producao
- [ ] Relatorios PDF reais (reportlab/weasyprint)
- [ ] Push Notifications reais (FCM/OneSignal)

### P2
- [ ] Stripe para plano Premium (substituir mock)
- [ ] Integracao com Google Calendar
- [ ] Modo Offline (Service Worker)
- [ ] Refatoracao do server.py em APIRouters

### P3
- [ ] Redis cache (V-Score, EnergyStatus)
- [ ] Watch face nativa com V-Score
- [ ] Dashboard analytics avancado
- [ ] App Mobile nativo (React Native)
