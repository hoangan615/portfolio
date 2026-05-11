from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.storage import storage
from modules.videos.models import Video, VideoJob
from modules.videos.schemas import VideoInitUpload, VideoUpdate
from shared.exceptions import NotFoundError
from shared.pagination import PageParams


async def init_upload(
    db: AsyncSession, user_id: UUID, data: VideoInitUpload
) -> tuple[Video, VideoJob, dict]:
    """Create video record + job, return presigned S3 upload details."""
    s3_key = storage.build_key("videos/raw", data.filename, user_id)

    video = Video(
        user_id=user_id,
        title=data.title,
        description=data.description,
        status="uploading",
        visibility=data.visibility,
        raw_s3_key=s3_key,
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)

    job = VideoJob(video_id=video.id, status="pending", progress=0)
    db.add(job)
    await db.flush()
    await db.refresh(job)

    presigned = storage.generate_presigned_upload_url(s3_key, data.content_type)
    return video, job, presigned


async def get_upload_status(db: AsyncSession, video_id: UUID, user_id: UUID) -> VideoJob:
    result = await db.execute(
        select(VideoJob)
        .join(Video, Video.id == VideoJob.video_id)
        .where(Video.id == video_id, Video.user_id == user_id)
        .order_by(VideoJob.created_at.desc())
        .limit(1)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise NotFoundError("VideoJob")
    return job


async def get_video(db: AsyncSession, video_id: UUID) -> Video:
    result = await db.execute(
        select(Video)
        .where(Video.id == video_id)
        .options(selectinload(Video.qualities))
    )
    video = result.scalar_one_or_none()
    if not video:
        raise NotFoundError("Video")
    return video


async def list_videos(
    db: AsyncSession,
    params: PageParams,
    user_id: UUID | None = None,
    visibility: str | None = "public",
) -> tuple[list[Video], int]:
    q = select(Video).where(Video.status == "ready")
    if visibility:
        q = q.where(Video.visibility == visibility)
    if user_id:
        q = q.where(Video.user_id == user_id)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Video.published_at.desc().nullslast(), Video.created_at.desc())
    q = q.offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def update_video(db: AsyncSession, video_id: UUID, user_id: UUID, data: VideoUpdate) -> Video:
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == user_id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise NotFoundError("Video")

    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(video, field, value)
    db.add(video)
    await db.flush()
    await db.refresh(video)
    return video


async def delete_video(db: AsyncSession, video_id: UUID, user_id: UUID) -> None:
    result = await db.execute(
        select(Video).where(Video.id == video_id, Video.user_id == user_id)
    )
    video = result.scalar_one_or_none()
    if not video:
        raise NotFoundError("Video")

    if video.raw_s3_key:
        try:
            storage.delete_object(video.raw_s3_key)
        except Exception:
            pass

    await db.delete(video)
    await db.flush()


async def increment_view(db: AsyncSession, video_id: UUID) -> None:
    await db.execute(
        update(Video).where(Video.id == video_id).values(view_count=Video.view_count + 1)
    )
    await db.flush()
