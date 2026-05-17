from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status

from modules.videos import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/videos", tags=["videos"])

MemberRequired = require_min_role("member")


@router.get("", response_model=PagedResponse[schemas.VideoOut])
async def list_videos(db: DBDep, params: PageParams = Depends()):
    videos, total = await service.list_videos(db, params, visibility="public")
    return PagedResponse.create(videos, total, params)  # pragma: no cover


@router.post(
    "/upload",
    response_model=schemas.UploadInitResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def init_upload(body: schemas.VideoInitUpload, current_user: CurrentUser, db: DBDep):
    video, job, presigned = await service.init_upload(db, current_user.id, body)  # type: ignore[union-attr]
    return schemas.UploadInitResponse(  # pragma: no cover
        video_id=video.id,
        job_id=job.id,
        upload_url=presigned.get("url", ""),
        upload_fields=presigned.get("fields", {}),
    )


@router.get("/upload/{video_id}/status", response_model=schemas.VideoJobOut, dependencies=[MemberRequired])
async def get_upload_status(video_id: UUID, current_user: CurrentUser, db: DBDep):
    return await service.get_upload_status(db, video_id, current_user.id)  # type: ignore[union-attr]  # pragma: no cover


@router.get("/{video_id}", response_model=schemas.VideoDetail)
async def get_video(video_id: UUID, db: DBDep):
    video = await service.get_video(db, video_id)
    await service.increment_view(db, video_id)  # pragma: no cover
    return video  # pragma: no cover


@router.put("/{video_id}", response_model=schemas.VideoOut, dependencies=[MemberRequired])
async def update_video(video_id: UUID, body: schemas.VideoUpdate, current_user: CurrentUser, db: DBDep):
    return await service.update_video(db, video_id, current_user.id, body)  # type: ignore[union-attr]


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[MemberRequired])
async def delete_video(video_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.delete_video(db, video_id, current_user.id)  # type: ignore[union-attr]
