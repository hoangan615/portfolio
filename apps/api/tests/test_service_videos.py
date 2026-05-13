"""Unit tests for videos/service.py — direct service calls."""
from __future__ import annotations

import uuid
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.users.models import User
from modules.videos.models import Video, VideoJob
from modules.videos.schemas import VideoInitUpload, VideoUpdate
from modules.videos import service
from shared.exceptions import NotFoundError
from shared.pagination import PageParams


def _page(page: int = 1, size: int = 20) -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = page
    p.page_size = size
    return p


async def _make_video(
    db: AsyncSession,
    user: User,
    *,
    status: str = "ready",
    visibility: str = "public",
    view_count: int = 0,
) -> Video:
    video = Video(
        user_id=user.id,
        title="Test Video",
        description="Desc",
        status=status,
        visibility=visibility,
        raw_s3_key="videos/raw/test.mp4",
        view_count=view_count,
    )
    db.add(video)
    job = VideoJob(video=video, status="completed", progress=100)
    db.add(job)
    await db.flush()
    await db.refresh(video)
    return video


# ── init_upload ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_init_upload(db_session: AsyncSession, regular_user: User):
    data = VideoInitUpload(title="My Video", filename="video.mp4")
    with patch("modules.videos.service.storage") as mock_storage:
        mock_storage.build_key.return_value = "videos/raw/video.mp4"
        mock_storage.generate_presigned_upload_url.return_value = {
            "url": "https://minio.example.com/upload",
            "fields": {"key": "videos/raw/video.mp4"},
        }
        video, job, presigned = await service.init_upload(db_session, regular_user.id, data)

    assert video.title == "My Video"
    assert video.status == "uploading"
    assert job.status == "pending"
    assert "url" in presigned


# ── get_upload_status ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_upload_status(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user, status="uploading")
    job = VideoJob(video_id=video.id, status="running", progress=50)
    db_session.add(job)
    await db_session.flush()

    found_job = await service.get_upload_status(db_session, video.id, regular_user.id)
    assert found_job is not None


@pytest.mark.asyncio
async def test_get_upload_status_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.get_upload_status(db_session, uuid.uuid4(), regular_user.id)


# ── get_video ─────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_video_found(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user)
    found = await service.get_video(db_session, video.id)
    assert found.id == video.id


@pytest.mark.asyncio
async def test_get_video_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.get_video(db_session, uuid.uuid4())


# ── list_videos ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_videos_public(db_session: AsyncSession, regular_user: User):
    await _make_video(db_session, regular_user, visibility="public")
    await _make_video(db_session, regular_user, visibility="private")
    videos, total = await service.list_videos(db_session, _page(), visibility="public")
    assert all(v.visibility == "public" for v in videos)


@pytest.mark.asyncio
async def test_list_videos_by_user(db_session: AsyncSession, regular_user: User, second_user: User):
    await _make_video(db_session, regular_user)
    await _make_video(db_session, second_user)
    videos, total = await service.list_videos(db_session, _page(), user_id=regular_user.id, visibility=None)
    assert all(v.user_id == regular_user.id for v in videos)


@pytest.mark.asyncio
async def test_list_videos_no_visibility_filter(db_session: AsyncSession, regular_user: User):
    await _make_video(db_session, regular_user, visibility="private")
    videos, total = await service.list_videos(db_session, _page(), visibility=None)
    assert total >= 1


# ── update_video ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_video_success(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user)
    data = VideoUpdate(title="Updated Title", visibility="unlisted")
    updated = await service.update_video(db_session, video.id, regular_user.id, data)
    assert updated.title == "Updated Title"
    assert updated.visibility == "unlisted"


@pytest.mark.asyncio
async def test_update_video_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.update_video(db_session, uuid.uuid4(), regular_user.id, VideoUpdate(title="X"))


@pytest.mark.asyncio
async def test_update_video_wrong_user(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    video = await _make_video(db_session, regular_user)
    with pytest.raises(NotFoundError):
        await service.update_video(db_session, video.id, second_user.id, VideoUpdate(title="Hack"))


# ── delete_video ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_video_success(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user)
    with patch("modules.videos.service.storage") as mock_storage:
        mock_storage.delete_object = MagicMock()
        await service.delete_video(db_session, video.id, regular_user.id)
        mock_storage.delete_object.assert_called_once()

    with pytest.raises(NotFoundError):
        await service.get_video(db_session, video.id)


@pytest.mark.asyncio
async def test_delete_video_storage_error_swallowed(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user)
    with patch("modules.videos.service.storage") as mock_storage:
        mock_storage.delete_object.side_effect = Exception("S3 error")
        # Should NOT raise even if storage fails
        await service.delete_video(db_session, video.id, regular_user.id)


@pytest.mark.asyncio
async def test_delete_video_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.delete_video(db_session, uuid.uuid4(), regular_user.id)


# ── increment_view ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_increment_view(db_session: AsyncSession, regular_user: User):
    video = await _make_video(db_session, regular_user, view_count=0)
    await service.increment_view(db_session, video.id)
    await db_session.refresh(video)
    assert video.view_count == 1
