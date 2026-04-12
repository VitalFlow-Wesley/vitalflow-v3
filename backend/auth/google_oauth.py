"""
backend/auth/google_oauth.py

Configuração do OAuth Google com access_type='offline' para salvar refresh_token.
IMPORTANTE: sem access_type='offline' + prompt='consent', o refresh_token não é retornado.
"""

import os
from google_auth_oauthlib.flow import Flow

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://vitalflow.ia.br/auth/callback")

SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/fitness.heart_rate.read",
    "https://www.googleapis.com/auth/fitness.sleep.read",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.body.read",
]


def get_authorization_url() -> tuple[str, str]:
    """
    Gera a URL de autorização Google.
    Retorna (url, state) para validação CSRF.

    CRÍTICO: access_type='offline' + prompt='consent' garante receber o refresh_token.
    Sem isso, o token de atualização nunca é retornado após o primeiro login.
    """
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    auth_url, state = flow.authorization_url(
        access_type="offline",      # ← ESSENCIAL: garante o refresh_token
        prompt="consent",           # ← Força o Google mostrar a tela de consentimento
        include_granted_scopes="true",
    )

    return auth_url, state


def exchange_code_for_tokens(code: str, db, user_id: int):
    """
    Troca o código de autorização pelos tokens e salva no banco.
    Chame esta função no callback /auth/callback.
    """
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    flow.fetch_token(code=code)
    credentials = flow.credentials

    if not credentials.refresh_token:
        # Se não veio o refresh_token, o usuário já autorizou antes sem revogar.
        # Instrua-o a revogar em https://myaccount.google.com/permissions e logar novamente.
        raise ValueError(
            "refresh_token não retornado. "
            "Peça ao usuário revogar permissões em https://myaccount.google.com/permissions "
            "e fazer login novamente."
        )

    # Salva tokens no banco (upsert)
    db.execute(
        """
        INSERT INTO user_tokens (user_id, access_token, refresh_token, token_expiry)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            access_token = excluded.access_token,
            refresh_token = excluded.refresh_token,
            token_expiry = excluded.token_expiry
        """,
        (
            user_id,
            credentials.token,
            credentials.refresh_token,
            credentials.expiry.isoformat() if credentials.expiry else None,
        )
    )
    db.commit()

    return credentials


"""
SQL para criar a tabela de tokens (execute no seu banco):

CREATE TABLE IF NOT EXISTS user_tokens (
    user_id      INTEGER PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry  TEXT,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""
