"""Unit tests for modules/media/service.py."""
from __future__ import annotations

import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from modules.media.models import Media
from modules.media import service
from modules.users.models import User
from shared.exceptions import BadRequestError, NotFoundError
from shared.pagination import PageParams


def _page() -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 20
    return p


def _make_upload_file(
    filename: str = "test.jpg",
    content_type: str = "image/jpeg",
    data: bytes = b"fake-image-data",
) -> UploadFile:
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = filename
    mock_file.content_type = content_type
    mock_file.read = AsyncMock(return_value=data)
    return mock_file


# ── upload_image ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_upload_image_invalid_type(db_session: AsyncSession, regular_user: User):
    file = _make_upload_file(content_type="application/pdf")
    with pytest.raises(BadRequestError, match="Unsupported"):
        await service.upload_image(db_session, regular_user.id, file)


@pytest.mark.asyncio
async def test_upload_image_too_large(db_session: AsyncSession, regular_user: User):
    large_data = b"x" * (11 * 1024 * 1024)  # 11 MB
    file = _make_upload_file(data=large_data)
    with pytest.raises(BadRequestError, match="too large"):
        await service.upload_image(db_session, regular_user.id, file)


@pytest.mark.asyncio
async def test_upload_image_success_gif(db_session: AsyncSession, regular_user: User):
    file = _make_upload_file(filename="test.gif", content_type="image/gif")
    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.build_key.return_value = "media/original/test.gif"
        mock_storage.upload_bytes.return_value = "https://cdn.example.com/test.gif"
        media = await service.upload_image(db_session, regular_user.id, file)
    assert media.mime_type == "image/gif"
    assert media.original_url == "https://cdn.example.com/test.gif"
    assert media.webp_url is None  # GIF doesn't get WebP conversion


@pytest.mark.asyncio
async def test_upload_image_no_filename(db_session: AsyncSession, regular_user: User):
    file = _make_upload_file(filename=None)
    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.build_key.return_value = "media/original/image.jpg"
        mock_storage.upload_bytes.return_value = "https://cdn.example.com/image.jpg"
        media = await service.upload_image(db_session, regular_user.id, file)
    assert media.filename == "image.jpg"


@pytest.mark.asyncio
async def test_upload_image_jpeg_with_pil(db_session: AsyncSession, regular_user: User):
    # Use real minimal JPEG bytes
    from PIL import Image as PILImage
    buf = io.BytesIO()
    img = PILImage.new("RGB", (100, 100), color=(255, 0, 0))
    img.save(buf, format="JPEG")
    jpeg_bytes = buf.getvalue()

    file = _make_upload_file(filename="photo.jpg", content_type="image/jpeg", data=jpeg_bytes)
    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.build_key.return_value = "key"
        mock_storage.upload_bytes.return_value = "https://cdn.example.com/photo.jpg"
        media = await service.upload_image(db_session, regular_user.id, file)
    assert media.width == 100
    assert media.height == 100
    assert media.webp_url is not None
    assert media.thumbnail_url is not None


# ── list_media ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_media_empty(db_session: AsyncSession, regular_user: User):
    items, total = await service.list_media(db_session, regular_user.id, _page())
    assert total == 0
    assert items == []


@pytest.mark.asyncio
async def test_list_media_returns_user_items(db_session: AsyncSession, regular_user: User):
    media = Media(
        user_id=regular_user.id,
        filename="test.jpg",
        original_url="https://cdn.example.com/test.jpg",
        mime_type="image/jpeg",
        file_size_bytes=1024,
    )
    db_session.add(media)
    await db_session.flush()

    items, total = await service.list_media(db_session, regular_user.id, _page())
    assert total == 1
    assert items[0].filename == "test.jpg"


# ── delete_media ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_media_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.delete_media(db_session, uuid.uuid4(), regular_user.id)


@pytest.mark.asyncio
async def test_delete_media_success(db_session: AsyncSession, regular_user: User):
    media = Media(
        user_id=regular_user.id,
        filename="del.jpg",
        original_url="https://cdn.example.com/del.jpg",
        mime_type="image/jpeg",
        file_size_bytes=512,
    )
    db_session.add(media)
    await db_session.flush()
    media_id = media.id

    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.public_url = "https://cdn.example.com"
        mock_storage.delete_object = MagicMock()
        await service.delete_media(db_session, media_id, regular_user.id)

    with pytest.raises(NotFoundError):
        await service.delete_media(db_session, media_id, regular_user.id)


@pytest.mark.asyncio
async def test_delete_media_with_webp_urls(db_session: AsyncSession, regular_user: User):
    media = Media(
        user_id=regular_user.id,
        filename="full.jpg",
        original_url="https://cdn.example.com/original.jpg",
        webp_url="https://cdn.example.com/webp.webp",
        thumbnail_url="https://cdn.example.com/thumb.webp",
        mime_type="image/jpeg",
        file_size_bytes=2048,
    )
    db_session.add(media)
    await db_session.flush()

    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.public_url = "https://cdn.example.com"
        mock_storage.delete_object = MagicMock()
        await service.delete_media(db_session, media.id, regular_user.id)
        # Should have called delete_object for original, webp, thumbnail
        assert mock_storage.delete_object.call_count == 3


@pytest.mark.asyncio
async def test_delete_media_storage_error_swallowed(db_session: AsyncSession, regular_user: User):
    media = Media(
        user_id=regular_user.id,
        filename="err.jpg",
        original_url="https://cdn.example.com/err.jpg",
        mime_type="image/jpeg",
        file_size_bytes=100,
    )
    db_session.add(media)
    await db_session.flush()

    with patch("modules.media.service.storage") as mock_storage:
        mock_storage.public_url = "https://cdn.example.com"
        mock_storage.delete_object.side_effect = Exception("S3 error")
        # Should not raise
        await service.delete_media(db_session, media.id, regular_user.id)
