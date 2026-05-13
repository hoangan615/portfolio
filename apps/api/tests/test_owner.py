"""
Tests for owner-account seeding logic and owner-specific behaviour.

These tests verify that:
  - create_owner_if_not_exists creates the owner with correct display_name
  - A second call is idempotent (does not create a duplicate)
  - Owner role grants access to admin-level endpoints
"""
from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, hash_password
from modules.auth.service import create_owner_if_not_exists
from modules.users.models import User, UserSettings


# ── Owner creation ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_owner_sets_display_name(db_session: AsyncSession):
    owner = await create_owner_if_not_exists(db_session)
    assert owner is not None
    # Name should be "Võ Hoàng Ân" (updated in main branch)
    assert owner.display_name == "Võ Hoàng Ân"


@pytest.mark.asyncio
async def test_create_owner_sets_role(db_session: AsyncSession):
    owner = await create_owner_if_not_exists(db_session)
    assert owner.role == "owner"


@pytest.mark.asyncio
async def test_create_owner_is_active_and_verified(db_session: AsyncSession):
    owner = await create_owner_if_not_exists(db_session)
    assert owner.status == "active"
    assert owner.email_verified is True


@pytest.mark.asyncio
async def test_create_owner_idempotent(db_session: AsyncSession):
    """Calling twice must not raise and must return the same user."""
    first = await create_owner_if_not_exists(db_session)
    second = await create_owner_if_not_exists(db_session)
    assert first.id == second.id


# ── Owner endpoint access ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_owner_can_access_me(client, db_session: AsyncSession):
    """Owner token must pass /users/me."""
    owner = await create_owner_if_not_exists(db_session)
    token = create_access_token(owner.id, owner.role)
    resp = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["role"] == "owner"
    assert resp.json()["display_name"] == "Võ Hoàng Ân"
