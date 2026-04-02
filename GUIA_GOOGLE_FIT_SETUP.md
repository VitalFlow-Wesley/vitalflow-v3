# Guia: Configuracao do Google Fit OAuth 2.0

## Pre-requisitos
- Conta Google (Gmail)
- Acesso ao Google Cloud Console: https://console.cloud.google.com

---

## Passo 1: Criar um Projeto no Google Cloud

1. Acesse https://console.cloud.google.com
2. No topo da pagina, clique no seletor de projeto (dropdown ao lado do logo)
3. Clique em **"Novo Projeto"**
4. Preencha:
   - **Nome do projeto:** `VitalFlow`
   - **Organizacao:** deixe o padrao
5. Clique em **"Criar"**
6. Aguarde a criacao e selecione o projeto `VitalFlow`

---

## Passo 2: Ativar a Fitness API

1. No menu lateral, va em **APIs e Servicos > Biblioteca**
2. Na barra de busca, pesquise: `Fitness API`
3. Clique em **"Fitness API"** (icone do Google Fit)
4. Clique no botao **"ATIVAR"**
5. Aguarde a ativacao (leva alguns segundos)

---

## Passo 3: Configurar a Tela de Consentimento OAuth

1. No menu lateral, va em **APIs e Servicos > Tela de consentimento OAuth**
2. Selecione o tipo de usuario:
   - Para testes: **Externo** (qualquer conta Google pode testar)
3. Clique em **"Criar"**
4. Preencha os dados obrigatorios:
   - **Nome do app:** `VitalFlow`
   - **Email de suporte:** seu email
   - **Logo:** (opcional)
   - **Dominios autorizados:** `emergentagent.com` (ou seu dominio de producao)
   - **Email do desenvolvedor:** seu email
5. Clique em **"Salvar e Continuar"**

### Escopos (Scopes)
6. Clique em **"Adicionar ou remover escopos"**
7. Pesquise e selecione os seguintes escopos:
   - `https://www.googleapis.com/auth/fitness.activity.read`
   - `https://www.googleapis.com/auth/fitness.heart_rate.read`
   - `https://www.googleapis.com/auth/fitness.sleep.read`
   - `https://www.googleapis.com/auth/fitness.body.read`
8. Clique em **"Atualizar"** e depois **"Salvar e Continuar"**

### Usuarios de Teste (enquanto o app nao for verificado)
9. Clique em **"Adicionar usuarios"**
10. Adicione os emails das pessoas que vao testar (incluindo o seu)
11. Clique em **"Salvar e Continuar"**
12. Revise e clique em **"Voltar ao painel"**

---

## Passo 4: Criar as Credenciais OAuth 2.0

1. No menu lateral, va em **APIs e Servicos > Credenciais**
2. Clique em **"+ CRIAR CREDENCIAIS"** > **"ID do cliente OAuth"**
3. Preencha:
   - **Tipo de aplicativo:** `Aplicativo da Web`
   - **Nome:** `VitalFlow Web`
   - **Origens JavaScript autorizadas:**
     - `https://biohack-vitals.preview.emergentagent.com`
     - (adicione tambem seu dominio de producao, se tiver)
   - **URIs de redirecionamento autorizados:**
     - `https://biohack-vitals.preview.emergentagent.com/api/wearables/google-fit/callback`
     - (adicione tambem seu dominio de producao, se tiver)
4. Clique em **"Criar"**

### Resultado
5. Uma janela mostrara:
   - **ID do cliente:** `xxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Chave secreta do cliente:** `GOCSPX-xxxxxxxxxxxxxxxxxx`
6. **COPIE AMBOS OS VALORES** (voce vai precisar deles)

---

## Passo 5: Adicionar as Chaves no VitalFlow

Apos obter as credenciais, me envie os valores e eu adicionarei no `.env` do backend:

```
GOOGLE_FIT_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_FIT_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxx
```

Ou, se preferir, voce pode adicionar diretamente no arquivo `/app/backend/.env`.

---

## O que acontece depois?

Assim que as credenciais forem adicionadas:

1. **O endpoint `/api/wearables/google-fit/status` retornara `configured: true`**
2. **O botao "Conectar via OAuth" no Google Health Connect ira iniciar o fluxo real:**
   - Usuario clica em "Conectar"
   - Redireciona para a tela de login do Google
   - Usuario autoriza o acesso aos dados de saude
   - Google redireciona de volta para o VitalFlow com um codigo
   - O backend troca o codigo por tokens e sincroniza os dados
3. **Dados reais de HRV, BPM, Sono e Passos serao puxados do Google Fit**
4. **O VitalFlow analisara esses dados com IA (GPT-4o) e gerara o V-Score real**

### Proximos passos apos ativacao:
- Atualizar o botao do Google Health Connect para usar o fluxo real
- Implementar sincronizacao periodica (cron) dos dados
- Adicionar refresh token automatico quando o access token expirar

---

## Observacoes Importantes

- **Enquanto o app estiver em modo "Teste"**, apenas os emails adicionados como
  usuarios de teste poderao autorizar. Para liberar para todos, e necessario
  submeter o app para verificacao do Google (leva 2-6 semanas).
- **A Fitness API e gratuita** (sem custo por chamada).
- **Os dados sao lidos, nunca escritos** (read-only).
- **LGPD/Privacidade:** O VitalFlow ja anonimiza dados no painel do gestor.
