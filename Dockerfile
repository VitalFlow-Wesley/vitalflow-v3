# ─── VitalFlow v3.1 ───
# Multi-stage build: Backend (FastAPI) + Frontend (React static via nginx)

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-build
WORKDIR /build

COPY frontend/package.json frontend/yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false

COPY frontend/ ./

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

RUN yarn build

# ── Stage 2: Runtime ──
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor curl gettext-base && \
    rm -rf /var/lib/apt/lists/*

# --- Backend setup ---
WORKDIR /app/backend

COPY backend/requirements.txt backend/emergentintegrations-0.1.0-py3-none-any.whl ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

# --- Frontend static files ---
COPY --from=frontend-build /build/build /app/frontend/build

# --- Nginx template ---
RUN mkdir -p /etc/nginx/templates

RUN cat > /etc/nginx/templates/default.conf.template << 'NGINX'
server {
    listen ${PORT};
    server_name _;

    location / {
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# --- Supervisor config ---
RUN cat > /etc/supervisor/conf.d/vitalflow.conf << 'SUPERVISOR'
[program:backend]
command=uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
directory=/app/backend
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/backend.err.log
stdout_logfile=/var/log/supervisor/backend.out.log

[program:nginx]
command=nginx -g "daemon off;"
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/nginx.err.log
stdout_logfile=/var/log/supervisor/nginx.out.log
SUPERVISOR

# --- Startup script ---
RUN cat > /app/start.sh << 'START'
#!/bin/sh
set -e

export PORT=${PORT:-8080}

envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-available/default

sleep 5

exec supervisord -n
START

RUN chmod +x /app/start.sh

EXPOSE 8080


CMD ["/app/start.sh"]