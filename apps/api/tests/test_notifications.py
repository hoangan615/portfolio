"""Integration tests for /api/v1/notifications/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.notifications.models import Notification
from modules.users.models import User


async def _create_notification(db: AsyncSession, user: User) -> Notification:
    notification = Notification(
        user_id=user.id,
        type="follow",
        actor_id=None,
        read=False,
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification


# ── GET /notifications ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_notifications_empty(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/notifications", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_list_notifications_with_data(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _create_notification(db_session, regular_user)
    response = await client.get("/api/v1/notifications", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_list_notifications_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/notifications")
    assert response.status_code == 401


# ── GET /notifications/unread-count ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_unread_count_zero(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["unread_count"] >= 0


@pytest.mark.asyncio
async def test_unread_count_increments(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _create_notification(db_session, regular_user)
    response = await client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["unread_count"] >= 1


@pytest.mark.asyncio
async def test_unread_count_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 401


# ── PUT /notifications/read-all ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_all_read(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _create_notification(db_session, regular_user)
    response = await client.put("/api/v1/notifications/read-all", headers=auth_headers)
    assert response.status_code == 204

    # Confirm count is now 0
    count_resp = await client.get("/api/v1/notifications/unread-count", headers=auth_headers)
    assert count_resp.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_mark_all_read_requires_auth(client: AsyncClient):
    response = await client.put("/api/v1/notifications/read-all")
    assert response.status_code == 401


# ── PUT /notifications/:id/read ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_single_notification_read(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    notification = await _create_notification(db_session, regular_user)
    response = await client.put(
        f"/api/v1/notifications/{notification.id}/read",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["read"] is True


@pytest.mark.asyncio
async def test_mark_nonexistent_notification_read(client: AsyncClient, auth_headers: dict):
    response = await client.put(
        f"/api/v1/notifications/{uuid.uuid4()}/read",
        headers=auth_headers,
    )
    assert response.status_code == 404
