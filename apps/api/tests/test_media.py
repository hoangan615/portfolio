"""Integration tests for /api/v1/media/* endpoints."""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.media.models import Media
from modules.users.models import User


async def _create_media(db: AsyncSession, user: User) -> Media:
    media = Media(
        user_id=user.id,
        filename="test.jpg",
        original_url="https://cdn.example.com/test.jpg",
        mime_type="image/jpeg",
        file_size_bytes=1024,
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)
    return media


# ── GET /media ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_media_empty(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/media", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert body["total"] == 0


@pytest.mark.asyncio
async def test_list_media_with_items(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _create_media(db_session, regular_user)
    response = await client.get("/api/v1/media", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_list_media_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/media")
    assert response.status_code == 401


# ── DELETE /media/{media_id} ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_media(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    media = await _create_media(db_session, regular_user)
    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.public_url = "https://cdn.example.com"
        mock_storage.delete_object = MagicMock()
        response = await client.delete(
            f"/api/v1/media/{media.id}",
            headers=auth_headers,
        )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_media_requires_auth(client: AsyncClient):
    import uuid
    response = await client.delete(f"/api/v1/media/{uuid.uuid4()}")
    assert response.status_code == 401
