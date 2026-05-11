# System Architecture

## Overview

A **monorepo community platform** combining:
1. **Portfolio** — Võ Hoàng An's personal portfolio page (owner-only editable)
2. **Tech Takeaway** — Open knowledge-sharing community (user-generated content)

---

## Service Topology

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx (Port 80)                        │
│  /          →  web:3000  (React SPA)                   │
│  /api/v1/*  →  api:8000  (FastAPI)                     │
│  /ws/*      →  api:8000  (WebSocket)                   │
└─────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌────────────────┐         ┌──────────────────────┐
│  React Web     │         │  FastAPI API          │
│  Port 3000     │         │  Port 8000            │
│  Vite dev /    │         │  SQLAlchemy 2 async   │
│  nginx static  │         │  Pydantic v2          │
└────────────────┘         └──────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
    ┌──────────────┐      ┌──────────────────┐   ┌──────────────────┐
    │  PostgreSQL  │      │      Redis        │   │     MinIO        │
    │  16-alpine   │      │   7-alpine        │   │  (S3-compat)     │
    │  Main DB     │      │  Cache + Queue    │   │  Media Storage   │
    └──────────────┘      └──────────────────┘   └──────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │   Celery Worker       │
                        │   FFmpeg Transcoding  │
                        │   HLS 1080/720/480p   │
                        └──────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | React + TypeScript | 18.x / 5.x | Vite, React Router v7 |
| State | TanStack Query + Zustand | 5.x / 5.x | Server + client state |
| UI | Tailwind CSS + Radix UI | 3.x | shadcn/ui pattern |
| Backend | FastAPI | 0.111+ | Async, Python 3.11+ |
| ORM | SQLAlchemy 2 + Alembic | 2.0+ | Async sessions |
| Validation | Pydantic v2 | 2.7+ | |
| Auth | python-jose + passlib | — | JWT RS256, bcrypt |
| Database | PostgreSQL | 16 | FTS + pg_trgm for search |
| Cache/Queue | Redis + Celery | 7.x / 5.x | Rate limit, job queue |
| Storage | MinIO / S3 | — | boto3 client |
| Video | FFmpeg + HLS.js | — | Celery worker |
| Email | Mailhog (dev) / SMTP | — | aiosmtplib |
| Proxy | Nginx | 1.27 | Reverse proxy + static |

---

## Backend Module Structure

```
apps/api/
├── main.py                   # FastAPI app, all routers registered
├── core/
│   ├── config.py             # Settings (pydantic-settings)
│   ├── db.py                 # Async engine + session factory
│   ├── security.py           # JWT, bcrypt, token helpers
│   ├── storage.py            # S3/MinIO boto3 wrapper
│   ├── queue.py              # Celery app config
│   └── middleware.py         # CORS, logging, timing
├── shared/
│   ├── dependencies.py       # get_db, get_current_user, role guards
│   ├── exceptions.py         # HTTP exception classes
│   └── pagination.py         # PagedResponse, PageParams
├── modules/
│   ├── auth/                 # Register, login, OAuth, JWT, email verify
│   ├── users/                # Profile, follow, settings, bookmarks
│   ├── portfolio/            # Owner portfolio (skills, experience, projects)
│   ├── posts/                # CRUD articles, shorts, galleries, TIL
│   ├── videos/               # Upload, processing pipeline, watch
│   ├── media/                # Image upload + media library
│   ├── comments/             # Nested comments (2 levels)
│   ├── reactions/            # Likes, emoji reactions, bookmarks
│   ├── feed/                 # Global, following, trending, explore
│   ├── search/               # PostgreSQL FTS + pg_trgm
│   ├── notifications/        # In-app + email notifications
│   ├── moderation/           # Report queue, sanctions
│   └── analytics/            # Views, stats, admin metrics
└── alembic/
    └── versions/             # Database migrations
```

---

## Frontend Module Structure

```
apps/web/src/
├── features/
│   ├── auth/         LoginForm, RegisterForm
│   ├── portfolio/    Hero, About, Skills, Experience, Projects, Contact
│   ├── community/    Feed (infinite scroll), TrendingWidget
│   ├── post/         PostEditor (TipTap), PostDetail
│   ├── video/        VideoUpload (chunked), WatchPage
│   ├── profile/      UserProfile, FollowButton
│   ├── notifications/ NotificationBell, NotificationList
│   └── admin/        AdminDashboard
├── pages/            Route-level wrappers (lazy loaded)
├── shared/
│   ├── api/          Axios functions per domain
│   ├── components/   Navbar, Avatar, Button, VideoPlayer, CommentSection…
│   ├── hooks/        useAuth, useInfiniteScroll, useUpload
│   └── stores/       authStore (Zustand), notificationStore, themeStore
└── lib/
    ├── constants.ts  QUERY_KEYS, ROUTES, config constants
    └── utils.ts      cn() helper
```

---

## Security Design

| Concern | Implementation |
|---------|---------------|
| Auth tokens | JWT Access (15 min) + Refresh (30 days, HttpOnly cookie) |
| Token rotation | Refresh token rotated on each use, old token revoked |
| Password | bcrypt + min 8 chars, uppercase + number |
| Rate limiting | fastapi-limiter (Redis) — 60 req/min default, custom per endpoint |
| SQL injection | SQLAlchemy parameterized queries, no raw SQL |
| XSS | Pydantic validation, React JSX escaping |
| File uploads | Magic bytes check (python-magic), content-type validation |
| CORS | Strict allow-list of origins |
| CSRF | SameSite=Strict cookie + Origin header check |

---

## User Roles

```
owner       → Full access, 1 person only (portfolio owner)
admin       → User management, content management, moderation
moderator   → Review queue, report handling, content hide/delete
member      → Post, upload video, comment, react, follow
restricted  → Read-only (too many reports)
banned      → No access
guest       → View public content only
pending     → Registered but email not verified
```

---

## Video Processing Pipeline

```
User uploads video
    ↓
POST /api/v1/videos/upload/init  → returns presigned S3 URL + job_id
    ↓
Client uploads directly to MinIO (chunked multipart)
    ↓
Client calls POST /api/v1/videos/upload/complete
    ↓
API queues Celery task: transcode_video(video_id)
    ↓
Worker (FFmpeg):
  ├── Download raw file from MinIO
  ├── Transcode → 1080p HLS, 720p HLS, 480p HLS
  ├── Generate thumbnail (frame at 3s)
  ├── Generate preview GIF (3s)
  ├── Extract metadata (duration, resolution)
  ├── Upload all outputs to MinIO
  └── Update video status: processing → ready
    ↓
Worker sends in-app + email notification to uploader
    ↓
GET /api/v1/videos/upload/status/:job_id (SSE polling)
```
