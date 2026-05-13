"""Unit tests for modules/auth/service.py helpers and core flows."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_email_verification_token, create_password_reset_token, hash_password
from modules.auth import service as auth_service
from modules.auth.schemas import LoginRequest, RegisterRequest, ResetPasswordRequest
from modules.users.models import RefreshToken, User, UserSettings
from shared.exceptions import BadRequestError, ConflictError, NotFoundError, UnauthorizedError


# ── Helpers ───────────────────────────────────────────────────────────────────


def test_hash_token():
    h1 = auth_service._hash_token("mysecrettoken")
    h2 = auth_service._hash_token("mysecrettoken")
    h3 = auth_service._hash_token("different")
    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 64  # sha256 hex


def test_token_response(regular_user: User):
    resp = auth_service._token_response(regular_user, "raw_refresh_token")
    assert resp.access_token
    assert resp.refresh_token == "raw_refresh_token"
    assert resp.token_type == "bearer"
    assert resp.expires_in > 0


@pytest.mark.asyncio
async def test_store_refresh_token(db_session: AsyncSession, regular_user: User):
    await auth_service._store_refresh_token(db_session, regular_user.id, "raw_token_abc")
    from sqlalchemy import select
    result = await db_session.execute(
        select(RefreshToken).where(RefreshToken.user_id == regular_user.id)
    )
    stored = result.scalar_one_or_none()
    assert stored is not None
    assert stored.revoked is False


# ── register ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_success(db_session: AsyncSession):
    with patch.object(auth_service, "send_verification_email", new=AsyncMock()):
        schema = RegisterRequest(
            username="brandnewuser",
            email="brandnew@example.com",
            password="StrongPass1!",
        )
        user = await auth_service.register(db_session, schema)
    assert user.username == "brandnewuser"
    assert user.status == "pending"
    assert user.email_verified is False
    assert user.role == "member"


@pytest.mark.asyncio
async def test_register_duplicate_email(db_session: AsyncSession, regular_user: User):
    with patch.object(auth_service, "send_verification_email", new=AsyncMock()):
        schema = RegisterRequest(
            username="newuserxyz",
            email=regular_user.email,  # duplicate
            password="StrongPass1!",
        )
        with pytest.raises(ConflictError, match="Email"):
            await auth_service.register(db_session, schema)


@pytest.mark.asyncio
async def test_register_duplicate_username(db_session: AsyncSession, regular_user: User):
    with patch.object(auth_service, "send_verification_email", new=AsyncMock()):
        schema = RegisterRequest(
            username=regular_user.username,  # duplicate
            email="uniquexyz@example.com",
            password="StrongPass1!",
        )
        with pytest.raises(ConflictError, match="Username"):
            await auth_service.register(db_session, schema)


@pytest.mark.asyncio
async def test_register_creates_user_settings(db_session: AsyncSession):
    with patch.object(auth_service, "send_verification_email", new=AsyncMock()):
        schema = RegisterRequest(
            username="settingsuser",
            email="settings@example.com",
            password="StrongPass1!",
            display_name="Settings User",
        )
        user = await auth_service.register(db_session, schema)
    from sqlalchemy import select
    result = await db_session.execute(select(UserSettings).where(UserSettings.user_id == user.id))
    assert result.scalar_one_or_none() is not None


# ── login ──────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_success(db_session: AsyncSession, regular_user: User):
    schema = LoginRequest(email=regular_user.email, password="Password123!")
    resp = await auth_service.login(db_session, schema)
    assert resp.access_token
    assert resp.refresh_token
    assert resp.token_type == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(db_session: AsyncSession, regular_user: User):
    schema = LoginRequest(email=regular_user.email, password="WrongPass!")
    with pytest.raises(UnauthorizedError):
        await auth_service.login(db_session, schema)


@pytest.mark.asyncio
async def test_login_nonexistent_email(db_session: AsyncSession):
    schema = LoginRequest(email="nobody@example.com", password="Whatever!")
    with pytest.raises(UnauthorizedError):
        await auth_service.login(db_session, schema)


@pytest.mark.asyncio
async def test_login_deleted_user(db_session: AsyncSession):
    deleted = User(
        username="deletedxyz",
        email="deleted_svc@example.com",
        password_hash=hash_password("Password123!"),
        role="member",
        status="deleted",
        email_verified=True,
    )
    db_session.add(deleted)
    await db_session.flush()

    schema = LoginRequest(email="deleted_svc@example.com", password="Password123!")
    with pytest.raises(UnauthorizedError):
        await auth_service.login(db_session, schema)


@pytest.mark.asyncio
async def test_login_suspended_user(db_session: AsyncSession):
    suspended = User(
        username="suspendedxyz",
        email="suspended_svc@example.com",
        password_hash=hash_password("Password123!"),
        role="member",
        status="suspended",
        email_verified=True,
    )
    db_session.add(suspended)
    await db_session.flush()

    schema = LoginRequest(email="suspended_svc@example.com", password="Password123!")
    with pytest.raises(UnauthorizedError):
        await auth_service.login(db_session, schema)


# ── refresh_tokens ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_refresh_tokens_success(db_session: AsyncSession, regular_user: User):
    schema = LoginRequest(email=regular_user.email, password="Password123!")
    initial = await auth_service.login(db_session, schema)

    resp = await auth_service.refresh_tokens(db_session, initial.refresh_token)
    assert resp.access_token
    assert resp.refresh_token != initial.refresh_token  # rotated


@pytest.mark.asyncio
async def test_refresh_tokens_invalid(db_session: AsyncSession):
    with pytest.raises(UnauthorizedError):
        await auth_service.refresh_tokens(db_session, "bad.token.here")


@pytest.mark.asyncio
async def test_refresh_tokens_revoked(db_session: AsyncSession, regular_user: User):
    schema = LoginRequest(email=regular_user.email, password="Password123!")
    initial = await auth_service.login(db_session, schema)

    # Revoke
    await auth_service.logout(db_session, initial.refresh_token)

    with pytest.raises(UnauthorizedError):
        await auth_service.refresh_tokens(db_session, initial.refresh_token)


# ── logout ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_logout_success(db_session: AsyncSession, regular_user: User):
    schema = LoginRequest(email=regular_user.email, password="Password123!")
    resp = await auth_service.login(db_session, schema)
    # Should not raise
    await auth_service.logout(db_session, resp.refresh_token)


@pytest.mark.asyncio
async def test_logout_invalid_token_silently_succeeds(db_session: AsyncSession):
    # Invalid tokens should not raise
    await auth_service.logout(db_session, "invalid.token.here")


@pytest.mark.asyncio
async def test_logout_nonexistent_token_silently_succeeds(db_session: AsyncSession, regular_user: User):
    from core.security import create_refresh_token
    # Valid format but not in DB
    raw = create_refresh_token(regular_user.id)
    await auth_service.logout(db_session, raw)  # Should not raise


# ── verify_email ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_verify_email_success(db_session: AsyncSession):
    user = User(
        username="unverifieduser",
        email="unverified@example.com",
        password_hash=hash_password("Pass123!"),
        role="member",
        status="pending",
        email_verified=False,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_email_verification_token(user.id)
    verified = await auth_service.verify_email(db_session, token)
    assert verified.email_verified is True
    assert verified.status == "active"


@pytest.mark.asyncio
async def test_verify_email_invalid_token(db_session: AsyncSession):
    with pytest.raises(BadRequestError):
        await auth_service.verify_email(db_session, "bad.verify.token")


# ── forgot_password ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_forgot_password_known_email(db_session: AsyncSession, regular_user: User):
    with patch.object(auth_service, "send_password_reset_email", new=AsyncMock()) as mock_send:
        await auth_service.forgot_password(db_session, regular_user.email)
        mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_forgot_password_unknown_email_no_error(db_session: AsyncSession):
    # Should not raise even for unknown email
    await auth_service.forgot_password(db_session, "nobody@example.com")


# ── reset_password ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_reset_password_success(db_session: AsyncSession, regular_user: User):
    token = create_password_reset_token(regular_user.id)
    schema = ResetPasswordRequest(token=token, new_password="NewPass456!")
    await auth_service.reset_password(db_session, schema)
    from core.security import verify_password
    await db_session.refresh(regular_user)
    assert verify_password("NewPass456!", regular_user.password_hash)


@pytest.mark.asyncio
async def test_reset_password_invalid_token(db_session: AsyncSession):
    schema = ResetPasswordRequest(token="bad.token.here", new_password="NewPass456!")
    with pytest.raises(BadRequestError):
        await auth_service.reset_password(db_session, schema)


# ── OAuth URL generators ───────────────────────────────────────────────────────


def test_get_google_auth_url():
    url = auth_service.get_google_auth_url("test-state-123")
    assert "accounts.google.com" in url
    assert "test-state-123" in url
    assert "openid" in url


def test_get_github_auth_url():
    url = auth_service.get_github_auth_url("gh-state-456")
    assert "github.com" in url
    assert "gh-state-456" in url
    assert "user:email" in url
