"""
Shared pytest fixtures for the portfolio API test suite.

Database isolation strategy:
  - Session-scoped: create all tables once, drop them all after the session.
  - Function-scoped: each test wraps its operations in a SAVEPOINT that is
    rolled back at teardown, so tests never pollute each other.

FastAPILimiter (Redis) is disabled via a patched no-op lifespan so tests
do not require a live Redis connection.
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

# ── Environment must be set BEFORE any app module is imported ────────────────
_TEST_DB = os.environ.get(
    "TEST_DATABASE_URL",
    os.environ.get(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:password@postgres:5432/portfolio_db",
    ),
)
os.environ["DATABASE_URL"] = _TEST_DB
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-portfolio-tests-32ch")
os.environ.setdefault("REDIS_URL", "redis://redis:6379/15")
os.environ.setdefault("APP_ENV", "test")

# ── App imports (after env is configured) ────────────────────────────────────
from core.db import Base  # noqa: E402
from core.security import create_access_token, hash_password  # noqa: E402
from modules.users.models import User, UserSettings  # noqa: E402, F401

# Register all ORM models so Base.metadata is complete
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

# ── Test engine (NullPool → no connection sharing between tests) ─────────────
_test_engine = create_async_engine(_TEST_DB, poolclass=NullPool, echo=False)
_TestSession = async_sessionmaker(
    bind=_test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ── Schema lifecycle ──────────────────────────────────────────────────────────


@pytest.fixture(scope="session", autouse=True)
async def create_tables():
    """Create schema once before all tests; drop after the session."""
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    yield
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _test_engine.dispose()


# ── Per-test database session (rolled-back after each test) ──────────────────


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yields an AsyncSession; all writes are rolled back after the test."""
    async with _test_engine.connect() as conn:
        await conn.begin()
        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            await conn.rollback()


# ── No-op lifespan (skips FastAPILimiter / Redis init) ───────────────────────


@asynccontextmanager
async def _noop_lifespan(app):  # type: ignore[type-arg]
    yield


# ── FastAPI test application ──────────────────────────────────────────────────


@pytest.fixture
def test_app(db_session: AsyncSession):
    """FastAPI app with test DB and no rate limiting."""
    with patch("main.lifespan", _noop_lifespan):
        from main import create_application

        application = create_application()

    async def _override_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    application.dependency_overrides[get_db] = _override_db
    return application


# ── HTTP client ───────────────────────────────────────────────────────────────


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


# ── Auth header helpers ───────────────────────────────────────────────────────


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
