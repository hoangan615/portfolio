"""Integration tests for /api/v1/feed/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post
from modules.users.models import User


async def _create_published_post(db: AsyncSession, user: User) -> Post:
    from datetime import UTC, datetime

    post = Post(
        user_id=user.id,
        type="article",
        title="Feed Post",
        slug=f"feed-post-{uuid.uuid4().hex[:8]}",
        content="<p>Feed content</p>",
        status="published",
        published_at=datetime.now(UTC),
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


# ── GET /feed (following feed) ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_following_feed_authenticated(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/feed", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_following_feed_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/feed")
    assert response.status_code == 401


# ── GET /feed/global ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_global_feed(client: AsyncClient):
    response = await client.get("/api/v1/feed/global")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_global_feed_returns_published(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    await _create_published_post(db_session, regular_user)
    response = await client.get("/api/v1/feed/global")
    assert response.status_code == 200
    assert response.json()["total"] >= 1


# ── GET /feed/trending ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_trending_feed(client: AsyncClient):
    response = await client.get("/api/v1/feed/trending")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body


# ── GET /feed/explore ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_explore_feed_authenticated(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/feed/explore", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body


@pytest.mark.asyncio
async def test_explore_feed_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/feed/explore")
    assert response.status_code == 401
