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

# Install nginx for serving frontend
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor curl && \
    rm -rf /var/lib/apt/lists/*

# --- Backend setup ---
WORKDIR /app/backend

# AJUSTE CRUCIAL: Copiamos o requirements E o arquivo .whl antes de instalar
COPY backend/requirements.txt backend/emergentintegrations-0.1.0-py3-none-any.whl ./

# Agora o pip instala sem erro porque o arquivo .whl já está na pasta
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos o restante do código do backend
COPY backend/ ./

# --- Frontend static files (served by nginx) ---
COPY --from=frontend-build /build/build /app/frontend/build

# Nginx config: serve frontend + proxy /api to backend
RUN cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80;
    server_name _;

    # Frontend (React static)
    location / {
        root /app/frontend/build;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 10s;
    }
}
NGINX

# Supervisor config: run nginx + uvicorn
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

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/api/ || exit 1

CMD ["supervisord", "-n"]