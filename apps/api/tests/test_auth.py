"""Integration tests for /api/v1/auth/* endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_refresh_token, hash_password
from modules.users.models import RefreshToken, User, UserSettings


# ── Register ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "StrongPass1!",
        "display_name": "New User",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, regular_user: User):
    payload = {
        "username": "uniqueuser2",
        "email": regular_user.email,
        "password": "StrongPass1!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient, regular_user: User):
    payload = {
        "username": regular_user.username,
        "email": "unique2@example.com",
        "password": "StrongPass1!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    payload = {
        "username": "weakpassuser",
        "email": "weak@example.com",
        "password": "short",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_username(client: AsyncClient):
    payload = {
        "username": "bad username!",
        "email": "ok@example.com",
        "password": "StrongPass1!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_invalid_email(client: AsyncClient):
    payload = {
        "username": "validuser",
        "email": "not-an-email",
        "password": "StrongPass1!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, regular_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "Password123!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_sets_cookie(client: AsyncClient, regular_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "Password123!"},
    )
    assert response.status_code == 200
    assert "refresh_token" in response.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, regular_user: User):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "WrongPass!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Whatever123!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_banned_user(client: AsyncClient, db_session: AsyncSession):
    banned = User(
        username="bannedguy",
        email="banned@example.com",
        password_hash=hash_password("Password123!"),
        role="member",
        status="banned",
        email_verified=True,
    )
    db_session.add(banned)
    await db_session.flush()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "banned@example.com", "password": "Password123!"},
    )
    assert response.status_code == 401


# ── Token refresh ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_refresh_with_body(client: AsyncClient, regular_user: User, db_session: AsyncSession):
    # First login to get a real refresh token
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    # New refresh token must differ (rotation)
    assert body["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_refresh_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "totally.invalid.token"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_no_token(client: AsyncClient):
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


# ── Logout ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, regular_user: User):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "Password123!"},
    )
    refresh_token = login_resp.json()["refresh_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 204

    # Using the revoked token again must fail
    reuse = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert reuse.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient, regular_user: User):
    await client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "Password123!"},
    )
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 204


# ── Forgot / Reset password ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forgot_password_returns_ok_regardless_of_email(client: AsyncClient):
    # Should not reveal whether email exists
    for email in ("exists@example.com", "notexist@example.com"):
        response = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": email},
        )
        assert response.status_code == 200
        assert "message" in response.json()


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "bad.token.here", "new_password": "NewPass123!"},
    )
    assert response.status_code == 400
