"""Integration tests for /api/v1/users/* endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.users.models import Follow, User


# ── GET /users/me ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_me_authenticated(client: AsyncClient, regular_user: User, auth_headers: dict):
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == regular_user.username
    assert body["email"] == regular_user.email
    assert "password_hash" not in body


@pytest.mark.asyncio
async def test_get_me_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer bad.token.here"},
    )
    assert response.status_code == 401


# ── PATCH /users/me ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_me(client: AsyncClient, auth_headers: dict):
    response = await client.patch(
        "/api/v1/users/me",
        json={"display_name": "Updated Name", "bio": "Hello world"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["display_name"] == "Updated Name"
    assert body["bio"] == "Hello world"


@pytest.mark.asyncio
async def test_update_me_invalid_url(client: AsyncClient, auth_headers: dict):
    response = await client.patch(
        "/api/v1/users/me",
        json={"website_url": "not-a-url"},
        headers=auth_headers,
    )
    assert response.status_code == 422


# ── GET /users/:username ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_profile(client: AsyncClient, regular_user: User):
    response = await client.get(f"/api/v1/users/{regular_user.username}")
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == regular_user.username
    # Email must NOT be exposed in public profile
    assert "email" not in body or body.get("email") is None


@pytest.mark.asyncio
async def test_get_user_not_found(client: AsyncClient):
    response = await client.get("/api/v1/users/definitely_does_not_exist_xyz")
    assert response.status_code == 404


# ── Follow system ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_follow_user(
    client: AsyncClient,
    regular_user: User,
    second_user: User,
    auth_headers: dict,
):
    response = await client.post(
        f"/api/v1/users/{second_user.username}/follow",
        headers=auth_headers,
    )
    assert response.status_code in (200, 201, 204)


@pytest.mark.asyncio
async def test_cannot_follow_self(
    client: AsyncClient,
    regular_user: User,
    auth_headers: dict,
):
    response = await client.post(
        f"/api/v1/users/{regular_user.username}/follow",
        headers=auth_headers,
    )
    assert response.status_code in (400, 409)


@pytest.mark.asyncio
async def test_unfollow_user(
    client: AsyncClient,
    regular_user: User,
    second_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    # Manually create follow relationship
    follow = Follow(follower_id=regular_user.id, following_id=second_user.id)
    db_session.add(follow)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/users/{second_user.username}/follow",
        headers=auth_headers,
    )
    assert response.status_code in (200, 204)


@pytest.mark.asyncio
async def test_follow_requires_auth(client: AsyncClient, second_user: User):
    response = await client.post(f"/api/v1/users/{second_user.username}/follow")
    assert response.status_code == 401


# ── GET /users/me/settings ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_settings(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/users/me/settings", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "email_on_follow" in body
    assert "profile_public" in body
    assert "theme" in body


@pytest.mark.asyncio
async def test_update_settings(client: AsyncClient, auth_headers: dict):
    response = await client.patch(
        "/api/v1/users/me/settings",
        json={"email_on_follow": False, "theme": "dark"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["email_on_follow"] is False
