"""Integration tests for /api/v1/comments/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.comments.models import Comment
from modules.posts.models import Post
from modules.users.models import User


async def _create_post(db: AsyncSession, user: User) -> Post:
    from datetime import UTC, datetime

    post = Post(
        user_id=user.id,
        type="article",
        title="Commented Post",
        slug=f"commented-post-{uuid.uuid4().hex[:8]}",
        content="<p>Content</p>",
        status="published",
        published_at=datetime.now(UTC),
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def _create_comment(db: AsyncSession, user: User, post: Post) -> Comment:
    comment = Comment(
        user_id=user.id,
        content_type="post",
        content_id=post.id,
        body="This is a test comment.",
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


# ── GET /comments ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_comments(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    await _create_comment(db_session, regular_user, post)

    response = await client.get(
        "/api/v1/comments",
        params={"content_type": "post", "content_id": str(post.id)},
    )
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert body["total"] >= 1


@pytest.mark.asyncio
async def test_list_comments_empty(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    response = await client.get(
        "/api/v1/comments",
        params={"content_type": "post", "content_id": str(post.id)},
    )
    assert response.status_code == 200
    assert response.json()["total"] == 0


@pytest.mark.asyncio
async def test_list_comments_missing_content_id(client: AsyncClient):
    response = await client.get(
        "/api/v1/comments",
        params={"content_type": "post"},
    )
    assert response.status_code == 422


# ── POST /comments ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_comment(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/comments",
        json={
            "content_type": "post",
            "content_id": str(post.id),
            "body": "Great article!",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["body"] == "Great article!"
    assert body["content_type"] == "post"


@pytest.mark.asyncio
async def test_create_comment_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/comments",
        json={"content_type": "post", "content_id": str(post.id), "body": "Hi"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_comment_invalid_content_type(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    response = await client.post(
        "/api/v1/comments",
        json={"content_type": "bad_type", "content_id": str(post.id), "body": "Hi"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_reply_comment(
    client: AsyncClient,
    regular_user: User,
    second_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    parent = await _create_comment(db_session, regular_user, post)

    response = await client.post(
        "/api/v1/comments",
        json={
            "content_type": "post",
            "content_id": str(post.id),
            "parent_id": str(parent.id),
            "body": "Reply to comment",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["parent_id"] == str(parent.id)


# ── PUT /comments/:id ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_comment(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    comment = await _create_comment(db_session, regular_user, post)

    response = await client.put(
        f"/api/v1/comments/{comment.id}",
        json={"body": "Updated comment body"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["body"] == "Updated comment body"


# ── DELETE /comments/:id ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_own_comment(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    post = await _create_post(db_session, regular_user)
    comment = await _create_comment(db_session, regular_user, post)

    response = await client.delete(
        f"/api/v1/comments/{comment.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_comment_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    post = await _create_post(db_session, regular_user)
    comment = await _create_comment(db_session, regular_user, post)

    response = await client.delete(f"/api/v1/comments/{comment.id}")
    assert response.status_code == 401
