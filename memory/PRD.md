# VitalFlow - Product Requirements Document (PRD)

## Problema Original
Motor de analise preditiva e copiloto de longevidade e saude mental corporativo. Recebe dados biometricos (HRV, BPM, Carga Cognitiva/Sono) e transforma em V-Score (0-100), identificando Area Afetada, Status Visual e gerando Nudges de acao via IA.

## Stack Tecnico
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend:** FastAPI, Python, Motor (MongoDB async), PyJWT, bcrypt
- **IA:** GPT-4o via Emergent LLM Key (emergentintegrations)
- **Banco:** MongoDB

## Status: v2.0 Go-to-Market (Fevereiro 2026)

### Todas as Features Implementadas
- [x] Autenticacao JWT completa
- [x] Filtro de Dominio Corporativo (B2B vs B2C)
- [x] Analise Biometrica com GPT-4o
- [x] StatusOrb (esfera abstrata com pulsacao variavel)
- [x] MetricBars (barras de progresso)
- [x] EnergyStatus em tempo real
- [x] Conectar 4 providers de wearables
- [x] Webhook Smartwatch + LGPD
- [x] Notificacoes Push simuladas
- [x] Dashboard do Gestor
- [x] IA Preditiva (30min antecedencia)
- [x] Exportacao PDF
- [x] UI Minimalista
- [x] Gamificacao: Pontos de Energia (+50/nudge)
- [x] Gamificacao: Streaks + Badge "Biohacker da Semana"
- [x] Gamificacao: Leaderboard Top 10
- [x] Trava Premium (B2C Free vs Premium)
- [x] Boas-Vindas Corporativas personalizadas

### Testes: 15/15 backend + 13/13 frontend = 100%

## Backlog
- [ ] P1: PDFs reais, Push FCM
- [ ] P2: Stripe, Google Calendar, Offline, Refatoracao
- [ ] P3: Redis, Watch face, Mobile React Native

## Arquivos de Referencia
- Documento completo: /app/VITALFLOW_ARQUITETURA_FINAL.md
- ZIP consolidado: /app/VITALFLOW_v2.0_COMPLETO.zip (31 arquivos)
