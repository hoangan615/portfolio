# Local Development Setup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 24+ with Docker Compose v2
- Git

No local Python or Node.js installation required when using Docker.

---

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/hoangan615/portfolio.git
cd portfolio

# Copy environment template
cp .env.example .env
```

Open `.env` and change:
- `SECRET_KEY` → any random string of 32+ characters
- `OWNER_EMAIL`, `OWNER_PASSWORD` → your admin login

### 2. Start all services

```bash
make dev
# or: docker compose up -d
```

First start takes 2-3 minutes to pull images and run migrations.

### 3. Seed initial data

```bash
make seed
```

This creates the owner account (`OWNER_EMAIL` / `OWNER_PASSWORD`) and populates portfolio data.

### 4. Access the app

| Service | URL | Notes |
|---------|-----|-------|
| **App** | http://localhost | Main entry (Nginx) |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **MinIO Console** | http://localhost:9001 | Storage admin (minioadmin / minioadmin) |
| **Mailhog** | http://localhost:8025 | Catch-all email viewer |
| **Flower** | http://localhost:5555 | Celery task monitor |

---

## Common Commands

```bash
make dev          # Start all containers (detached)
make down         # Stop all containers
make logs         # Follow all logs (Ctrl+C to exit)
make build        # Rebuild all images
make migrate      # Apply latest DB migrations
make seed         # Seed owner + portfolio data (idempotent)
make shell-api    # sh into API container
make shell-db     # psql into PostgreSQL
make ps           # Show container status
make restart      # Restart all services
make clean        # DESTRUCTIVE: remove containers + volumes
```

---

## Service Details

| Service | Container | Port | Image |
|---------|-----------|------|-------|
| Nginx | portfolio_nginx | **80** | nginx:1.27-alpine |
| React Frontend | portfolio_web | 3000 | custom build |
| FastAPI Backend | portfolio_api | **8000** | custom build |
| PostgreSQL | portfolio_postgres | 5432 | postgres:16-alpine |
| Redis | portfolio_redis | 6379 | redis:7-alpine |
| MinIO | portfolio_minio | 9000 / **9001** | minio/minio |
| Mailhog | portfolio_mailhog | 1025 / **8025** | mailhog/mailhog |
| Celery Worker | portfolio_worker | — | custom build |
| Flower | portfolio_flower | **5555** | custom build |

Bold ports are browser-accessible.

---

## Development Without Docker (Optional)

Requires: Python 3.11+, Node 20+, pnpm, local PostgreSQL 16, Redis 7.

**Backend:**
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set env vars or create apps/api/.env
export DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/portfolio_db
export REDIS_URL=redis://localhost:6379/0
export SECRET_KEY=dev-secret-key-change-me

alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd apps/web
pnpm install
pnpm dev
# Open http://localhost:3000
```

---

## Troubleshooting

**Containers keep restarting:**
```bash
make logs  # check which service is failing
docker compose logs api --tail=50
```

**Database migration fails:**
```bash
make shell-api
alembic current
alembic history
alembic upgrade head
```

**Port already in use:**
```bash
# Change ports in docker-compose.yml or kill the conflicting process
lsof -i :80
```

**MinIO bucket missing:**
```bash
docker compose restart minio-init
```
