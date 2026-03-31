# VitalFlow - Product Requirements Document (PRD)

## Problema Original
Motor de análise preditiva e copiloto de longevidade e saúde mental corporativo. Recebe dados biométricos (HRV, BPM, Carga Cognitiva/Sono) e transforma em V-Score (0-100), identificando Área Afetada, Status Visual e gerando Nudges de ação via IA.

## Stack Técnico
- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Framer Motion, Recharts
- **Backend:** FastAPI, Python, Motor (MongoDB async), PyJWT, bcrypt
- **IA:** GPT-4o via Emergent LLM Key (emergentintegrations)
- **Banco:** MongoDB

## Funcionalidades Implementadas (MVP 1.0)
- [x] Autenticação JWT (Login/Register/Logout/Profile)
- [x] Filtro de Domínio Corporativo (B2B vs B2C automático)
- [x] Análise Biométrica com GPT-4o (V-Score + Nudge)
- [x] Mapa Anatômico 3D (Heatmap com zonas pulsantes)
- [x] EnergyStatus (bolinha visual em tempo real)
- [x] Conectar Dispositivos (4 providers: Google, Apple, Garmin, Fitbit)
- [x] Webhook de Smartwatch (detecção estresse/fadiga)
- [x] Anonimização LGPD
- [x] Notificações Push simuladas (toasts)
- [x] Dashboard do Gestor (métricas anonimizadas)
- [x] IA Preditiva (previsão de estresse com 30min antecedência)
- [x] Exportação de relatório PDF (dados JSON)
- [x] Histórico de V-Score (gráfico de linha)
- [x] Fallback sem IA (análise algorítmica local)
- [x] Documento de Arquitetura Final gerado

## Backlog (Próximos Passos)
### P0
- [ ] Gamificação Básica (Pontos de Energia: +50 ao seguir Nudge)
- [ ] Limite Free vs Premium (B2C)

### P1
- [ ] Mensagem de Boas-Vindas Personalizada (Login Corporativo)
- [ ] Relatórios PDF reais (reportlab/weasyprint)

### P2
- [ ] Push Notifications reais (FCM/OneSignal)
- [ ] Integração com Google Calendar
- [ ] Modo Offline (Service Worker)
- [ ] Refatoração do server.py em APIRouters separados

### P3
- [ ] Watch face nativa com V-Score
- [ ] Dashboard analytics avançado
