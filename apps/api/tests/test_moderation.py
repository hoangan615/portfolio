"""Integration tests for /api/v1/moderation/* endpoints."""
from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.moderation.models import Report
from modules.users.models import User


async def _create_report(db: AsyncSession, reporter: User) -> Report:
    report = Report(
        reporter_id=reporter.id,
        content_type="post",
        content_id=uuid.uuid4(),
        reason="Spam content",
        status="pending",
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def _make_moderator(db: AsyncSession, user: User) -> User:
    user.role = "moderator"
    db.add(user)
    await db.flush()
    return user


# ── POST /moderation/reports ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_report(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.post(
        "/api/v1/moderation/reports",
        json={
            "content_type": "post",
            "content_id": str(uuid.uuid4()),
            "reason": "Spam content",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["reason"] == "Spam content"
    assert body["status"] == "pending"


@pytest.mark.asyncio
async def test_create_report_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/moderation/reports",
        json={
            "content_type": "post",
            "content_id": str(uuid.uuid4()),
            "reason": "Spam",
        },
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_report_invalid_content_type(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.post(
        "/api/v1/moderation/reports",
        json={
            "content_type": "invalid",
            "content_id": str(uuid.uuid4()),
            "reason": "Bad",
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


# ── GET /moderation/reports (moderator only) ──────────────────────────────────


@pytest.mark.asyncio
async def test_list_reports_forbidden_for_regular_user(
    client: AsyncClient,
    auth_headers: dict,
):
    response = await client.get("/api/v1/moderation/reports", headers=auth_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_reports_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/moderation/reports")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_reports_as_moderator(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _make_moderator(db_session, regular_user)
    response = await client.get("/api/v1/moderation/reports", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body


# ── PUT /moderation/reports/:id (moderator only) ──────────────────────────────


@pytest.mark.asyncio
async def test_review_report_as_moderator(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _make_moderator(db_session, regular_user)
    report = await _create_report(db_session, regular_user)

    response = await client.put(
        f"/api/v1/moderation/reports/{report.id}",
        json={"status": "reviewed"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "reviewed"


@pytest.mark.asyncio
async def test_review_report_forbidden_for_member(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    report = await _create_report(db_session, regular_user)
    response = await client.put(
        f"/api/v1/moderation/reports/{report.id}",
        json={"status": "reviewed"},
        headers=auth_headers,
    )
    assert response.status_code == 403


# ── POST /moderation/actions (moderator only) ─────────────────────────────────


@pytest.mark.asyncio
async def test_create_moderation_action_as_moderator(
    client: AsyncClient,
    regular_user: User,
    second_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _make_moderator(db_session, regular_user)
    response = await client.post(
        "/api/v1/moderation/actions",
        json={
            "target_user_id": str(second_user.id),
            "action_type": "warn",
            "reason": "Posted spam content",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["action_type"] == "warn"
