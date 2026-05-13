"""Integration tests for /api/v1/reactions/* and /api/v1/bookmarks/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post
from modules.reactions.models import Bookmark, Reaction
from modules.users.models import User


async def _create_post(db: AsyncSession, user: User) -> Post:
    from datetime import UTC, datetime

    post = Post(
        user_id=user.id,
        type="article",
        title="Reaction Post",
        slug=f"reaction-post-{uuid.uuid4().hex[:8]}",
        content="<p>Content</p>",
        status="published",
        published_at=datetime.now(UTC),
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


# ── Reaction summary ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reaction_summary_empty(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    response = await client.get(
        "/api/v1/reactions/summary",
        params={"content_type": "post", "content_id": str(post.id)},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_reaction_summary_invalid_type(client: AsyncClient):
    response = await client.get(
        "/api/v1/reactions/summary",
        params={"content_type": "bad", "content_id": str(uuid.uuid4())},
    )
    assert response.status_code == 422


# ── Add reaction ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_reaction(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/reactions",
        json={"content_type": "post", "content_id": str(post.id), "emoji": "👍"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["emoji"] == "👍"
    assert body["content_type"] == "post"


@pytest.mark.asyncio
async def test_add_reaction_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/reactions",
        json={"content_type": "post", "content_id": str(post.id), "emoji": "👍"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_reaction_invalid_content_type(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.post(
        "/api/v1/reactions",
        json={"content_type": "invalid", "content_id": str(uuid.uuid4()), "emoji": "👍"},
        headers=auth_headers,
    )
    assert response.status_code == 422


# ── Remove reaction ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_reaction(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    reaction = Reaction(
        user_id=regular_user.id,
        content_type="post",
        content_id=post.id,
        emoji="❤️",
    )
    db_session.add(reaction)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/reactions/{reaction.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


# ── Bookmarks ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_bookmarks(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/bookmarks", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_bookmarks_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/bookmarks")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_add_bookmark(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/bookmarks",
        json={"content_type": "post", "content_id": str(post.id)},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["content_type"] == "post"


@pytest.mark.asyncio
async def test_add_bookmark_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/bookmarks",
        json={"content_type": "post", "content_id": str(post.id)},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_remove_bookmark(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    bookmark = Bookmark(
        user_id=regular_user.id,
        content_type="post",
        content_id=post.id,
    )
    db_session.add(bookmark)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/bookmarks/{bookmark.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204
