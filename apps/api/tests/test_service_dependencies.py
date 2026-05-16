"""Unit tests for shared/dependencies.py."""
from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock, patch

from core.security import create_access_token, hash_password
from modules.users.models import User, UserSettings
from shared.dependencies import (
    ROLE_HIERARCHY,
    _get_token_payload,
    get_current_user,
    get_current_user_optional,
    require_min_role,
    require_role,
    require_verified_email,
)
from shared.exceptions import ForbiddenError, UnauthorizedError


# ── ROLE_HIERARCHY ────────────────────────────────────────────────────────────


def test_role_hierarchy_ordering():
    assert ROLE_HIERARCHY["owner"] > ROLE_HIERARCHY["admin"]
    assert ROLE_HIERARCHY["admin"] > ROLE_HIERARCHY["moderator"]
    assert ROLE_HIERARCHY["moderator"] > ROLE_HIERARCHY["member"]
    assert ROLE_HIERARCHY["member"] > ROLE_HIERARCHY["restricted"]
    assert ROLE_HIERARCHY["restricted"] > ROLE_HIERARCHY["guest"]
    assert ROLE_HIERARCHY["guest"] > ROLE_HIERARCHY["banned"]
    assert ROLE_HIERARCHY["banned"] == 0


# ── _get_token_payload ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_token_payload_no_credentials():
    with pytest.raises(UnauthorizedError, match="Missing Bearer token"):
        await _get_token_payload(None)


@pytest.mark.asyncio
async def test_get_token_payload_invalid_token():
    creds = MagicMock()
    creds.credentials = "bad.token.here"
    with pytest.raises(UnauthorizedError):
        await _get_token_payload(creds)


@pytest.mark.asyncio
async def test_get_token_payload_valid(regular_user: User):
    from fastapi.security import HTTPAuthorizationCredentials
    token = create_access_token(regular_user.id, regular_user.role)
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = await _get_token_payload(creds)
    assert payload["sub"] == str(regular_user.id)


# ── get_current_user ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_current_user_success(db_session: AsyncSession, regular_user: User):
    token = create_access_token(regular_user.id, regular_user.role)
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = await _get_token_payload(creds)
    user = await get_current_user(payload, db_session)
    assert user.id == regular_user.id


@pytest.mark.asyncio
async def test_get_current_user_not_found(db_session: AsyncSession):
    import uuid
    fake_id = uuid.uuid4()
    from core.security import create_access_token as cat
    token = cat(fake_id, "member")
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = await _get_token_payload(creds)
    with pytest.raises(UnauthorizedError, match="User not found"):
        await get_current_user(payload, db_session)


@pytest.mark.asyncio
async def test_get_current_user_deleted_status_raises(db_session: AsyncSession):
    deleted = User(
        username="deletedstatusdep",
        email="deleted_status_dep@example.com",
        password_hash=hash_password("Pass123!"),
        role="member",
        status="deleted",
        email_verified=True,
    )
    db_session.add(deleted)
    await db_session.flush()

    token = create_access_token(deleted.id, deleted.role)
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = await _get_token_payload(creds)
    with pytest.raises(ForbiddenError):
        await get_current_user(payload, db_session)


@pytest.mark.asyncio
async def test_get_current_user_deleted_raises(db_session: AsyncSession):
    deleted = User(
        username="deletedxyz2",
        email="deleted_dep@example.com",
        password_hash=hash_password("Pass123!"),
        role="member",
        status="deleted",
        email_verified=True,
    )
    db_session.add(deleted)
    await db_session.flush()

    token = create_access_token(deleted.id, deleted.role)
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    payload = await _get_token_payload(creds)
    with pytest.raises(ForbiddenError):
        await get_current_user(payload, db_session)


# ── get_current_user_optional ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_current_user_optional_no_credentials(db_session: AsyncSession):
    result = await get_current_user_optional(None, db_session)
    assert result is None


@pytest.mark.asyncio
async def test_get_current_user_optional_invalid_token(db_session: AsyncSession):
    creds = MagicMock()
    creds.credentials = "bad.token.here"
    result = await get_current_user_optional(creds, db_session)
    assert result is None


@pytest.mark.asyncio
async def test_get_current_user_optional_valid(db_session: AsyncSession, regular_user: User):
    token = create_access_token(regular_user.id, regular_user.role)
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    result = await get_current_user_optional(creds, db_session)
    assert result is not None
    assert result.id == regular_user.id


@pytest.mark.asyncio
async def test_get_current_user_optional_nonexistent_user(db_session: AsyncSession):
    import uuid
    fake_id = uuid.uuid4()
    token = create_access_token(fake_id, "member")
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    result = await get_current_user_optional(creds, db_session)
    assert result is None


# ── require_role ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_require_role_passes_matching_role(regular_user: User):
    regular_user.role = "member"
    dep = require_role("member")
    inner = dep.dependency
    result = await inner(user=regular_user)
    assert result.id == regular_user.id


@pytest.mark.asyncio
async def test_require_role_raises_wrong_role(regular_user: User):
    regular_user.role = "member"
    dep = require_role("admin")
    inner = dep.dependency
    with pytest.raises(ForbiddenError):
        await inner(user=regular_user)


# ── require_min_role ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_require_min_role_passes_sufficient_role(regular_user: User):
    regular_user.role = "admin"
    dep = require_min_role("member")
    inner = dep.dependency
    result = await inner(user=regular_user)
    assert result.id == regular_user.id


@pytest.mark.asyncio
async def test_require_min_role_passes_exact_role(regular_user: User):
    regular_user.role = "member"
    dep = require_min_role("member")
    inner = dep.dependency
    result = await inner(user=regular_user)
    assert result.id == regular_user.id


@pytest.mark.asyncio
async def test_require_min_role_raises_insufficient_role(regular_user: User):
    regular_user.role = "guest"
    dep = require_min_role("member")
    inner = dep.dependency
    with pytest.raises(ForbiddenError, match="Insufficient role"):
        await inner(user=regular_user)


# ── require_verified_email ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_require_verified_email_passes(regular_user: User):
    regular_user.email_verified = True
    dep = require_verified_email()
    inner = dep.dependency
    result = await inner(user=regular_user)
    assert result.id == regular_user.id


@pytest.mark.asyncio
async def test_require_verified_email_raises_not_verified(regular_user: User):
    regular_user.email_verified = False
    dep = require_verified_email()
    inner = dep.dependency
    with pytest.raises(ForbiddenError, match="Email verification required"):
        await inner(user=regular_user)
