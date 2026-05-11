from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

import redis.asyncio as aioredis
import structlog
from fastapi import FastAPI
from fastapi_limiter import FastAPILimiter

from core.config import settings
from core.db import Base, engine
from core.middleware import RequestContextMiddleware, SecurityHeadersMiddleware, add_cors_middleware

# ── Import all models so Base.metadata is populated ──────────────────────────
import modules.users.models  # noqa: F401
import modules.portfolio.models  # noqa: F401
import modules.posts.models  # noqa: F401
import modules.videos.models  # noqa: F401
import modules.media.models  # noqa: F401
import modules.comments.models  # noqa: F401
import modules.reactions.models  # noqa: F401
import modules.notifications.models  # noqa: F401
import modules.moderation.models  # noqa: F401
import modules.analytics.models  # noqa: F401

from modules.analytics.router import router as analytics_router
from modules.auth.router import router as auth_router
from modules.comments.router import router as comments_router
from modules.feed.router import router as feed_router
from modules.media.router import router as media_router
from modules.moderation.router import router as moderation_router
from modules.notifications.router import router as notifications_router
from modules.portfolio.router import router as portfolio_router
from modules.posts.router import router as posts_router
from modules.reactions.router import router as reactions_router
from modules.search.router import router as search_router
from modules.users.router import router as users_router
from modules.videos.router import router as videos_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("Starting up…", env=settings.APP_ENV)

    # Rate-limiter (Redis)
    redis_conn = aioredis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis_conn)
    logger.info("FastAPILimiter initialised")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    await FastAPILimiter.close()
    await redis_conn.aclose()
    logger.info("Shutdown complete")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware ────────────────────────────────────────────────────────────
    add_cors_middleware(app)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestContextMiddleware)

    # ── Routers ───────────────────────────────────────────────────────────────
    prefix = settings.API_PREFIX  # "/api/v1"

    app.include_router(auth_router, prefix=prefix)
    app.include_router(users_router, prefix=prefix)
    app.include_router(portfolio_router, prefix=prefix)
    app.include_router(posts_router, prefix=prefix)
    app.include_router(videos_router, prefix=prefix)
    app.include_router(media_router, prefix=prefix)
    app.include_router(comments_router, prefix=prefix)
    app.include_router(reactions_router, prefix=prefix)
    app.include_router(feed_router, prefix=prefix)
    app.include_router(search_router, prefix=prefix)
    app.include_router(notifications_router, prefix=prefix)
    app.include_router(moderation_router, prefix=prefix)
    app.include_router(analytics_router, prefix=prefix)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health() -> dict[str, Any]:
        return {"status": "ok", "version": settings.APP_VERSION, "env": settings.APP_ENV}

    return app


app = create_application()
