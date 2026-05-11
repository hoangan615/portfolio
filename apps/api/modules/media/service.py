from __future__ import annotations

import io
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.storage import storage
from modules.media.models import Media
from shared.exceptions import BadRequestError, NotFoundError
from shared.pagination import PageParams

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def upload_image(db: AsyncSession, user_id: UUID, file: UploadFile) -> Media:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise BadRequestError(f"Unsupported image type: {file.content_type}")

    raw_data = await file.read()
    if len(raw_data) > MAX_FILE_SIZE:
        raise BadRequestError("File too large (max 10 MB)")

    filename = file.filename or "image.jpg"
    original_key = storage.build_key("media/original", filename, user_id)
    original_url = storage.upload_bytes(raw_data, original_key, file.content_type or "image/jpeg")

    # Try to get dimensions + create webp version
    webp_url: str | None = None
    thumbnail_url: str | None = None
    width: int | None = None
    height: int | None = None

    if file.content_type in ("image/jpeg", "image/png", "image/webp"):
        try:
            from PIL import Image

            img = Image.open(io.BytesIO(raw_data))
            width, height = img.size

            # WebP version
            webp_buf = io.BytesIO()
            img.save(webp_buf, format="WEBP", quality=85)
            webp_key = storage.build_key("media/webp", f"{filename}.webp", user_id)
            webp_url = storage.upload_bytes(webp_buf.getvalue(), webp_key, "image/webp")

            # Thumbnail (200x200 crop)
            thumb = img.copy()
            thumb.thumbnail((200, 200))
            thumb_buf = io.BytesIO()
            thumb.save(thumb_buf, format="WEBP", quality=75)
            thumb_key = storage.build_key("media/thumbnails", f"{filename}_thumb.webp", user_id)
            thumbnail_url = storage.upload_bytes(thumb_buf.getvalue(), thumb_key, "image/webp")
        except Exception:
            pass  # Best-effort image processing

    media = Media(
        user_id=user_id,
        filename=filename,
        original_url=original_url,
        webp_url=webp_url,
        thumbnail_url=thumbnail_url,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(raw_data),
        width=width,
        height=height,
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)
    return media


async def list_media(
    db: AsyncSession, user_id: UUID, params: PageParams
) -> tuple[list[Media], int]:
    q = select(Media).where(Media.user_id == user_id)
    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Media.created_at.desc()).offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def delete_media(db: AsyncSession, media_id: UUID, user_id: UUID) -> None:
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.user_id == user_id)
    )
    media = result.scalar_one_or_none()
    if not media:
        raise NotFoundError("Media")

    # Delete from S3 (best-effort)
    for url_field in ("original_url", "webp_url", "thumbnail_url"):
        url = getattr(media, url_field, None)
        if url:
            try:
                # Extract key from public URL
                key = url.replace(storage.public_url + "/", "")
                storage.delete_object(key)
            except Exception:
                pass

    await db.delete(media)
    await db.flush()
