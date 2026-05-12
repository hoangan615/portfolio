# Portfolio Platform — Claude Code Context

## Project Overview
Community platform monorepo: **Portfolio** (Võ Hoàng An) + **Tech Takeaway** community.

- Owner: Võ Hoàng An | GitHub: [hoangan615](https://github.com/hoangan615)
- Platform: Full-Stack community sharing knowledge — posts, videos, comments, follow system
- Backend: FastAPI (Python) | Frontend: React (TypeScript) | DB: PostgreSQL + Redis + MinIO

## Architecture
```
root/
├── apps/
│   ├── api/              FastAPI backend (Python 3.11+)
│   └── web/              React 18 + Vite frontend (TypeScript)
├── workers/
│   └── video-processor/  Celery + FFmpeg (HLS transcoding)
├── packages/
│   ├── types/            Shared TypeScript types
│   ├── utils/            Shared utilities (formatDate, slugify, etc.)
│   ├── ui/               Placeholder for shared UI
│   └── config/           Shared tsconfig
├── infra/
│   └── nginx/            Reverse proxy config
└── docs/                 Documentation
```

## Key Commands
```bash
# Docker (recommended)
make dev          # Start all services (docker compose up -d)
make down         # Stop all services
make logs         # Follow all logs
make migrate      # Run alembic upgrade head inside API container
make seed         # Seed owner account + portfolio data (run once)
make shell-api    # Enter API container shell
make shell-db     # psql into PostgreSQL
make build        # Rebuild all Docker images
make clean        # Remove containers + volumes (DESTRUCTIVE)

# Backend direct (needs local Python 3.11+ + PostgreSQL + Redis)
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000

# Frontend direct (needs Node 20+ + pnpm)
cd apps/web
pnpm install
pnpm dev
```

## Key Files
| File | Purpose |
|------|---------|
| `docker-compose.yml` | All service definitions |
| `.env.example` | Environment variables template → copy to `.env` |
| `apps/api/main.py` | FastAPI app entry point, all routers registered |
| `apps/api/core/config.py` | Settings (pydantic-settings) |
| `apps/api/core/db.py` | SQLAlchemy async engine + session |
| `apps/api/core/security.py` | JWT creation/verification, password hashing |
| `apps/api/alembic/versions/` | Database migrations |
| `apps/api/seed.py` | Seed owner account + portfolio data |
| `apps/web/src/router.tsx` | All frontend routes |
| `apps/web/src/shared/api/client.ts` | Axios instance + token refresh |
| `apps/web/src/shared/stores/authStore.ts` | Zustand auth state |
| `infra/nginx/conf.d/default.conf` | Nginx reverse proxy |

## Backend Module Structure
```
apps/api/modules/<name>/
├── __init__.py
├── models.py     # SQLAlchemy ORM models
├── schemas.py    # Pydantic v2 request/response
├── service.py    # Business logic
└── router.py     # FastAPI routes
```

Modules: auth, users, portfolio, posts, videos, media, comments, reactions, feed, search, notifications, moderation, analytics

## Frontend Structure
```
apps/web/src/
├── features/<name>/      Feature-specific components
├── pages/                Route-level page components
├── shared/
│   ├── api/              Axios API call functions
│   ├── components/       Reusable UI components
│   ├── hooks/            Custom React hooks
│   └── stores/           Zustand state stores
└── lib/
    ├── constants.ts      App-wide constants + query keys
    └── utils.ts          cn() helper (clsx + tailwind-merge)
```

## Routes
| URL | Page |
|-----|------|
| `/` | Portfolio (Võ Hoàng An's personal page) |
| `/community` | Tech Takeaway community feed |
| `/watch/:id` | Video watch page (HLS player) |
| `/post/:slug` | Blog post detail |
| `/u/:username` | Public user profile |
| `/login`, `/register` | Auth pages |
| `/settings` | User settings |
| `/dashboard/posts` | User's post management |
| `/dashboard/videos` | User's video management |
| `/admin` | Admin dashboard (admin+ only) |

## Environment Setup
Copy `.env.example` to `.env` and set:
- `SECRET_KEY` — random 32+ char string (REQUIRED)
- `OWNER_EMAIL`, `OWNER_USERNAME`, `OWNER_PASSWORD` — first admin
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` — for OAuth (optional)

## Database
PostgreSQL 16, managed by SQLAlchemy 2 async + Alembic.
All migrations in `apps/api/alembic/versions/`.
Always run `make migrate` after pulling new code.

## Access URLs (local Docker)
| Service | URL |
|---------|-----|
| App (Nginx) | http://localhost |
| API Swagger | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |
| Mailhog UI | http://localhost:8025 |
| Flower (Celery) | http://localhost:5555 |
