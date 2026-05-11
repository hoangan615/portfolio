from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status

from modules.media import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/media", tags=["media"])

MemberRequired = require_min_role("member")


@router.get("", response_model=PagedResponse[schemas.MediaOut], dependencies=[MemberRequired])
async def list_media(current_user: CurrentUser, db: DBDep, params: PageParams = Depends()):
    items, total = await service.list_media(db, current_user.id, params)  # type: ignore[union-attr]
    return PagedResponse.create(items, total, params)


@router.post(
    "/upload",
    response_model=schemas.MediaOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def upload_image(
    current_user: CurrentUser,
    db: DBDep,
    file: UploadFile = File(...),
):
    return await service.upload_image(db, current_user.id, file)  # type: ignore[union-attr]


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[MemberRequired])
async def delete_media(media_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.delete_media(db, media_id, current_user.id)  # type: ignore[union-attr]
