"""Integration tests for /api/v1/posts/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post
from modules.users.models import User


# ── Helper ────────────────────────────────────────────────────────────────────


async def _create_published_post(
    db_session: AsyncSession,
    user: User,
    *,
    title: str = "Test Post",
    slug: str | None = None,
) -> Post:
    from datetime import UTC, datetime

    post = Post(
        user_id=user.id,
        type="article",
        title=title,
        slug=slug or f"test-post-{uuid.uuid4().hex[:8]}",
        content="<p>Hello world</p>",
        excerpt="Excerpt here",
        status="published",
        published_at=datetime.now(UTC),
    )
    db_session.add(post)
    await db_session.flush()
    await db_session.refresh(post)
    return post


# ── List posts ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_posts_empty(client: AsyncClient):
    response = await client.get("/api/v1/posts")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_list_posts_returns_published_only(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    await _create_published_post(db_session, regular_user)
    # Also create a draft that must NOT appear
    draft = Post(
        user_id=regular_user.id,
        type="article",
        title="Draft",
        slug=f"draft-{uuid.uuid4().hex[:8]}",
        status="draft",
    )
    db_session.add(draft)
    await db_session.flush()

    response = await client.get("/api/v1/posts")
    assert response.status_code == 200
    items = response.json()["items"]
    for item in items:
        assert item["status"] == "published"


# ── Create post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_post_authenticated(client: AsyncClient, auth_headers: dict):
    payload = {
        "type": "article",
        "title": "My New Post",
        "content": "<p>Content here</p>",
        "excerpt": "Short excerpt",
    }
    response = await client.post("/api/v1/posts", json=payload, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "My New Post"
    assert body["status"] == "draft"
    assert "slug" in body


@pytest.mark.asyncio
async def test_create_post_unauthenticated(client: AsyncClient):
    response = await client.post(
        "/api/v1/posts",
        json={"type": "article", "title": "Fail", "content": "nope"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_post_invalid_type(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/posts",
        json={"type": "invalid_type", "title": "Bad type"},
        headers=auth_headers,
    )
    assert response.status_code == 422


# ── Get post by slug ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_post_by_slug(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_published_post(db_session, regular_user, slug="my-unique-slug")
    response = await client.get(f"/api/v1/posts/{post.slug}")
    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == post.slug
    assert body["title"] == post.title


@pytest.mark.asyncio
async def test_get_post_not_found(client: AsyncClient):
    response = await client.get("/api/v1/posts/slug-does-not-exist-xyz")
    assert response.status_code == 404


# ── Delete post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_own_post(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_published_post(db_session, regular_user)
    response = await client.delete(f"/api/v1/posts/{post.id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_other_users_post_forbidden(
    client: AsyncClient,
    second_user: User,
    db_session: AsyncSession,
    auth_headers: dict,  # logged in as regular_user
):
    post = await _create_published_post(db_session, second_user)
    response = await client.delete(f"/api/v1/posts/{post.id}", headers=auth_headers)
    assert response.status_code == 403


# ── Update post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_post(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    admin_headers: dict,
):
    post = await _create_published_post(db_session, regular_user)
    response = await client.put(
        f"/api/v1/posts/{post.id}",
        json={"title": "Updated Title"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


# ── Submit for review ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_submit_post_for_review(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    draft = Post(
        user_id=regular_user.id,
        type="article",
        title="Submittable Post",
        slug=f"submit-{uuid.uuid4().hex[:8]}",
        content="<p>Content</p>",
        status="draft",
    )
    db_session.add(draft)
    await db_session.flush()

    response = await client.post(
        f"/api/v1/posts/{draft.id}/submit",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "pending_review"


# ── Publish post ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_publish_post(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    draft = Post(
        user_id=regular_user.id,
        type="article",
        title="Publishable Post",
        slug=f"publish-{uuid.uuid4().hex[:8]}",
        content="<p>Content</p>",
        status="draft",
    )
    db_session.add(draft)
    await db_session.flush()

    response = await client.post(
        f"/api/v1/posts/{draft.id}/publish",
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None


@pytest.mark.asyncio
async def test_publish_other_users_post_forbidden(
    client: AsyncClient,
    second_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = Post(
        user_id=second_user.id,
        type="article",
        title="Other User Post",
        slug=f"other-{uuid.uuid4().hex[:8]}",
        status="draft",
    )
    db_session.add(post)
    await db_session.flush()

    response = await client.post(
        f"/api/v1/posts/{post.id}/publish",
        headers=auth_headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_publish_post_unauthenticated(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = Post(
        user_id=regular_user.id,
        type="article",
        title="Unauth Publish",
        slug=f"unauth-{uuid.uuid4().hex[:8]}",
        status="draft",
    )
    db_session.add(post)
    await db_session.flush()

    response = await client.post(f"/api/v1/posts/{post.id}/publish")
    assert response.status_code == 401
