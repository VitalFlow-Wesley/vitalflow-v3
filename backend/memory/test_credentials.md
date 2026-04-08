# VitalFlow - Credenciais de Teste

## Admin/Gestor
- Email: admin@vitalflow.com
- Senha: Admin123!@#
- Nivel: Gestor
- Setor: Administrativo

## Endpoints de Autenticacao
- POST /api/auth/register - Cadastro
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/auth/me - Dados do colaborador logado
- PUT /api/auth/profile - Atualizar perfil
- POST /api/auth/forgot-password - Recuperacao de senha

## Endpoints Protegidos
- POST /api/analyze - Criar analise
- GET /api/history - Historico de analises
- GET /api/wearables - Dispositivos conectados
- GET /api/dashboard/metrics - Metricas (apenas gestores)
- GET /api/predictive/alert - Alerta preditivo (Premium/Corporate only)

## Gamificacao
- POST /api/gamification/follow-nudge - Seguir nudge (+50 pts)
- GET /api/gamification/stats - Estatisticas
- GET /api/gamification/leaderboard - Top 10

## Premium
- GET /api/billing/plan - Info do plano
- POST /api/billing/upgrade - Upgrade para Premium (mock)

## Smartwatch
- POST /api/smartwatch/analyze - Analise em tempo real com IA
- POST /api/smartwatch/webhook - Webhook para dados reais
- GET /api/smartwatch/history - Historico de alertas
