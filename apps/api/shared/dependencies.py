from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_async_session
from core.security import decode_token
from shared.exceptions import ForbiddenError, UnauthorizedError

bearer_scheme = HTTPBearer(auto_error=False)

# ── DB dependency ─────────────────────────────────────────────────────────────


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async for session in get_async_session():
        yield session


DBDep = Annotated[AsyncSession, Depends(get_db)]


# ── Auth dependencies ─────────────────────────────────────────────────────────


async def _get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> dict:
    if not credentials:
        raise UnauthorizedError("Missing Bearer token")
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except JWTError as exc:
        raise UnauthorizedError(str(exc)) from exc
    return payload


async def get_current_user(
    payload: Annotated[dict, Depends(_get_token_payload)],
    db: DBDep,
):
    """Return the authenticated User ORM object."""
    # Import here to avoid circular imports
    from modules.users.models import User

    user_id: str = payload.get("sub", "")
    stmt = select(User).where(User.id == UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedError("User not found")
    if user.status in ("banned", "deleted"):
        raise ForbiddenError(f"Account is {user.status}")
    return user


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: DBDep,
):
    """Return user if authenticated, else None."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials, expected_type="access")
    except JWTError:
        return None

    from modules.users.models import User

    user_id: str = payload.get("sub", "")
    try:
        stmt = select(User).where(User.id == UUID(user_id))
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except Exception:
        return None


CurrentUser = Annotated[object, Depends(get_current_user)]
OptionalUser = Annotated[object | None, Depends(get_current_user_optional)]


# ── Role-based guards ─────────────────────────────────────────────────────────

ROLE_HIERARCHY = {
    "owner": 100,
    "admin": 80,
    "moderator": 60,
    "member": 40,
    "restricted": 20,
    "guest": 10,
    "banned": 0,
}


def require_role(*roles: str):
    """Dependency factory that checks if current user has one of the given roles."""

    async def _check(user=Depends(get_current_user)):
        if user.role not in roles:
            raise ForbiddenError(f"Requires one of roles: {', '.join(roles)}")
        return user

    return Depends(_check)


def require_min_role(min_role: str):
    """Dependency factory: user must have at least min_role in hierarchy."""
    min_level = ROLE_HIERARCHY.get(min_role, 0)

    async def _check(user=Depends(get_current_user)):
        user_level = ROLE_HIERARCHY.get(user.role, 0)
        if user_level < min_level:
            raise ForbiddenError(f"Insufficient role. Requires at least {min_role}")
        return user

    return Depends(_check)


def require_verified_email():
    async def _check(user=Depends(get_current_user)):
        if not user.email_verified:
            raise ForbiddenError("Email verification required")
        return user

    return Depends(_check)


# Convenience aliases
AdminRequired = require_min_role("admin")
ModeratorRequired = require_min_role("moderator")
OwnerRequired = require_role("owner")
