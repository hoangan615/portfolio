"""
Shared pytest fixtures — SQLite+aiosqlite backend (no PostgreSQL/Docker needed).

Isolation strategy
──────────────────
• session-scoped  : schema is created once before all tests, dropped after.
• function-scoped : every test gets a fresh AsyncSession; all writes are
                    rolled back via a SAVEPOINT so tests never share state.

Redis / FastAPILimiter
──────────────────────
The app lifespan is replaced with a no-op context manager so tests never
attempt to connect to Redis.
"""
from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# ── MUST be set before any app module is imported ────────────────────────────
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./portfolio_test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-portfolio-tests-32ch"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["APP_ENV"] = "test"
os.environ["CELERY_BROKER_URL"] = "memory://"
os.environ["CELERY_RESULT_BACKEND"] = "cache+memory://"

# ── App imports (after env vars are in place) ─────────────────────────────────
from core.db import Base  # noqa: E402
from core.security import create_access_token, hash_password  # noqa: E402
from modules.users.models import User, UserSettings  # noqa: E402, F401

# Register every model so Base.metadata is fully populated
import modules.analytics.models  # noqa: E402, F401
import modules.comments.models  # noqa: E402, F401
import modules.media.models  # noqa: E402, F401
import modules.moderation.models  # noqa: E402, F401
import modules.notifications.models  # noqa: E402, F401
import modules.portfolio.models  # noqa: E402, F401
import modules.posts.models  # noqa: E402, F401
import modules.reactions.models  # noqa: E402, F401
import modules.videos.models  # noqa: E402, F401

from shared.dependencies import get_db  # noqa: E402

# ── Dedicated test engine (SQLite) ────────────────────────────────────────────
TEST_DB_URL = "sqlite+aiosqlite:///./portfolio_test.db"

_test_engine = create_async_engine(
    TEST_DB_URL,
    poolclass=NullPool,
    echo=False,
    connect_args={"check_same_thread": False},
)
_TestSession = async_sessionmaker(
    bind=_test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Schema lifecycle (once per test session) ──────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
async def create_tables():
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _test_engine.dispose()


# ── Per-test session (rolled back) ────────────────────────────────────────────

@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Each test gets its own session; everything is rolled back on teardown."""
    async with _TestSession() as session:
        yield session
        await session.rollback()


# ── No-op lifespan (skips Redis / FastAPILimiter) ────────────────────────────

@asynccontextmanager
async def _noop_lifespan(app):  # type: ignore[type-arg]
    yield


# ── FastAPI test application ──────────────────────────────────────────────────

@pytest.fixture
def test_app(db_session: AsyncSession):
    with patch("main.lifespan", _noop_lifespan):
        from main import create_application
        application = create_application()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    application.dependency_overrides[get_db] = _override_db
    return application


# ── Async HTTP client ─────────────────────────────────────────────────────────

@pytest.fixture
async def client(test_app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=test_app), base_url="http://test"
    ) as ac:
        yield ac


# ── User fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
async def regular_user(db_session: AsyncSession) -> User:
    user = User(
        username="testuser",
        email="testuser@example.com",
        password_hash=hash_password("Password123!"),
        display_name="Test User",
        role="member",
        status="active",
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    db_session.add(UserSettings(user_id=user.id))
    await db_session.flush()
    return user


@pytest.fixture
async def second_user(db_session: AsyncSession) -> User:
    user = User(
        username="seconduser",
        email="second@example.com",
        password_hash=hash_password("Password123!"),
        display_name="Second User",
        role="member",
        status="active",
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    db_session.add(UserSettings(user_id=user.id))
    await db_session.flush()
    return user


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        username="adminuser",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        display_name="Admin",
        role="admin",
        status="active",
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    db_session.add(UserSettings(user_id=user.id))
    await db_session.flush()
    return user


# ── Auth helpers ──────────────────────────────────────────────────────────────

@pytest.fixture
def user_token(regular_user: User) -> str:
    return create_access_token(regular_user.id, regular_user.role)


@pytest.fixture
def admin_token(admin_user: User) -> str:
    return create_access_token(admin_user.id, admin_user.role)


@pytest.fixture
def auth_headers(user_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}
