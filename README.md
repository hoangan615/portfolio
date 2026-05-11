# Portfolio & Tech Takeaway

> Personal portfolio + open community platform — by **Võ Hoàng An**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)

---

## About

This project has two main spaces:

| Space | URL | Description |
|-------|-----|-------------|
| **Portfolio** | `/` | Võ Hoàng An's personal page — skills, experience, projects |
| **Tech Takeaway** | `/community` | Open community — posts, videos, comments, follow |

---

## Features

### Portfolio
- Hero section with CTA, social links, CV download
- Skills grouped by category with proficiency levels
- Career timeline (FPT Software — 9+ years)
- Featured projects with tech stack and live/repo links
- Contact form → email notification to owner

### Community (Tech Takeaway)
- **Posts** — rich text articles, short notes, galleries, TIL
- **Videos** — chunked upload, HLS adaptive streaming, PiP, quality selector
- **Follow system** — follow users and tags, personalized feed
- **Comments** — nested 2-level, inline code, @mentions, emoji reactions
- **Moderation** — report queue, content review, user sanctions
- **Admin dashboard** — analytics, user management, content CRUD

### Auth
- Email/password registration with email verification
- OAuth2 — Google & GitHub
- JWT (15 min access + 30-day refresh with rotation)
- "Forgot password" email flow

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/hoangan615/portfolio.git
cd portfolio

# 2. Configure
cp .env.example .env
# Edit .env: set SECRET_KEY to a 32+ char random string

# 3. Start
make dev

# 4. Seed owner account (first run only)
make seed
```

Open **http://localhost** in your browser.

---

## Access URLs

| Service | URL | Notes |
|---------|-----|-------|
| App | http://localhost | Main entry (Nginx) |
| API Docs | http://localhost:8000/docs | Swagger UI |
| MinIO Console | http://localhost:9001 | `minioadmin` / `minioadmin` |
| Mailhog | http://localhost:8025 | Catch-all email viewer |
| Flower | http://localhost:5555 | Celery task monitor |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, React Router v7 |
| State | TanStack Query 5, Zustand 5 |
| UI | Tailwind CSS 3, Radix UI, shadcn/ui |
| Editor | TipTap (rich text) |
| Video | HLS.js (adaptive streaming) |
| Backend | Python FastAPI, SQLAlchemy 2, Pydantic v2 |
| Auth | JWT, OAuth2 (Google, GitHub), python-jose, passlib |
| Database | PostgreSQL 16, Alembic migrations |
| Cache/Queue | Redis 7, Celery 5 |
| Storage | MinIO (S3-compatible), boto3 |
| Video Worker | FFmpeg (HLS 1080p/720p/480p), Celery |
| Email | Mailhog (dev), SMTP/SendGrid (prod) |
| Proxy | Nginx 1.27 |
| Monorepo | Turborepo + pnpm workspaces |

---

## Project Structure

```
portfolio/
├── apps/
│   ├── web/            React SPA (Vite)
│   └── api/            FastAPI backend
├── workers/
│   └── video-processor/ Celery + FFmpeg
├── packages/
│   ├── types/          Shared TypeScript types
│   ├── utils/          Shared utilities
│   ├── ui/             Shared UI components
│   └── config/         Shared configs
├── infra/
│   └── nginx/          Nginx config
├── docs/               Documentation
├── docker-compose.yml
├── .env.example
├── Makefile
└── CLAUDE.md           Claude Code context
```

---

## Documentation

- [Setup Guide](docs/setup.md) — local dev setup, commands
- [Architecture](docs/architecture.md) — system design, tech decisions
- [API Reference](docs/api.md) — all endpoints
- [Database Schema](docs/database.md) — tables and relationships
- [Deployment](docs/deployment.md) — production guide

---

## Author

**Võ Hoàng An** — Full-Stack Developer & Tech Lead at FPT Software

- 9 years web development (.NET/C#, ReactJS, Angular)
- 5 years mobile development (React Native)
- Domain experience: E-commerce, Logistics, Loyalty, Healthcare, Real Estate

[![GitHub](https://img.shields.io/badge/GitHub-hoangan615-181717?logo=github)](https://github.com/hoangan615)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-hoangan615-0077B5?logo=linkedin)](https://linkedin.com/in/hoangan615)

---

## License

MIT © 2026 Võ Hoàng An
