"""Integration tests for /api/v1/videos/* endpoints."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.users.models import User
from modules.videos.models import Video, VideoJob


async def _create_video(db: AsyncSession, user: User, *, visibility: str = "public") -> Video:
    video = Video(
        user_id=user.id,
        title="Test Video",
        description="A test video",
        status="ready",
        visibility=visibility,
        raw_s3_key="videos/raw/test.mp4",
    )
    db.add(video)
    job = VideoJob(video=video, status="completed", progress=100)
    db.add(job)
    await db.flush()
    await db.refresh(video)
    return video


# ── GET /videos ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_videos_empty(client: AsyncClient):
    response = await client.get("/api/v1/videos")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert isinstance(body["items"], list)


@pytest.mark.asyncio
async def test_list_videos_shows_public(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    await _create_video(db_session, regular_user, visibility="public")
    response = await client.get("/api/v1/videos")
    assert response.status_code == 200
    assert response.json()["total"] >= 1


# ── GET /videos/:id ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_video(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    video = await _create_video(db_session, regular_user, visibility="public")
    response = await client.get(f"/api/v1/videos/{video.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Test Video"


@pytest.mark.asyncio
async def test_get_video_not_found(client: AsyncClient):
    response = await client.get(f"/api/v1/videos/{uuid.uuid4()}")
    assert response.status_code == 404


# ── PUT /videos/:id ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_video(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    video = await _create_video(db_session, regular_user)
    response = await client.put(
        f"/api/v1/videos/{video.id}",
        json={"title": "Updated Title", "description": "New description"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_update_video_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    video = await _create_video(db_session, regular_user)
    response = await client.put(
        f"/api/v1/videos/{video.id}",
        json={"title": "No auth"},
    )
    assert response.status_code == 401


# ── DELETE /videos/:id ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_video(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    video = await _create_video(db_session, regular_user)
    with patch("modules.videos.service.storage") as mock_storage:
        mock_storage.delete_object = MagicMock()
        response = await client.delete(f"/api/v1/videos/{video.id}", headers=auth_headers)
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_video_requires_auth(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
):
    video = await _create_video(db_session, regular_user)
    response = await client.delete(f"/api/v1/videos/{video.id}")
    assert response.status_code == 401


# ── POST /videos/upload ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_init_upload(
    client: AsyncClient,
    auth_headers: dict,
):
    fake_presigned = {"url": "https://minio.example.com/upload", "fields": {"key": "videos/raw/test.mp4"}}
    with patch("modules.videos.service.storage") as mock_storage:
        mock_storage.build_key.return_value = "videos/raw/test.mp4"
        mock_storage.generate_presigned_upload_url.return_value = fake_presigned
        response = await client.post(
            "/api/v1/videos/upload",
            json={
                "title": "My Upload",
                "filename": "myvideo.mp4",
                "content_type": "video/mp4",
            },
            headers=auth_headers,
        )
    assert response.status_code == 201
    body = response.json()
    assert "video_id" in body
    assert "upload_url" in body


@pytest.mark.asyncio
async def test_init_upload_requires_auth(client: AsyncClient):
    response = await client.post(
        "/api/v1/videos/upload",
        json={"title": "Fail", "filename": "test.mp4"},
    )
    assert response.status_code == 401
