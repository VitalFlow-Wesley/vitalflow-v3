# VitalFlow - Product Requirements Document (PRD)

## Status: v2.3 (Abril 2026) - Regras de Permissao Implementadas

## Stack: React 19 + FastAPI + MongoDB + GPT-4o (Emergent LLM)

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
- [x] Legados removidos (AffectedAreas, HumanBodyHeatmap)

### Permissoes e Restricoes (v2.3) - Abril 2026
- [x] Profile: campos Setor, Cargo, Nivel de Acesso read-only com cadeado para corporativos
- [x] Profile: Nome e Data de Nascimento editaveis
- [x] Register: simplificado para contas pessoais (B2C) sem Setor/Nivel de Acesso
- [x] Register: aviso para corporativos - cadastro pelo gestor
- [x] Login: funcionalidade "Esqueci minha senha" com geracao de senha temporaria
- [x] GestorDashboard: modal de adicionar funcionario com campo Nivel de Acesso (User/Gestor)
- [x] Backend: endpoint POST /api/auth/forgot-password
- [x] Backend: add-employee aceita nivel_acesso

### Testes: 9/9 backend + 19/19 frontend (iteration 6) = 100%

## Backlog
- [ ] P0: Onboarding Interativo (Aha moment nos primeiros 60s)
- [ ] P1: Stripe real, Push FCM, Google Fit/Apple Health real
- [ ] P2: Mobile React Native, Watch face
- [ ] P3: Redis, Service Worker real
- [ ] Refatoracao: server.py (2300+ linhas) -> routes/, models/, services/
