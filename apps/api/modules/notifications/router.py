from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status

from modules.notifications import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])

AuthRequired = require_min_role("member")


@router.get(
    "",
    response_model=PagedResponse[schemas.NotificationOut],
    dependencies=[AuthRequired],
)
async def list_notifications(
    current_user: CurrentUser,
    db: DBDep,
    params: PageParams = Depends(),
):
    items, total = await service.list_notifications(db, current_user.id, params)  # type: ignore[union-attr]
    return PagedResponse.create(items, total, params)  # pragma: no cover


@router.get(
    "/unread-count",
    response_model=schemas.UnreadCountResponse,
    dependencies=[AuthRequired],
)
async def unread_count(current_user: CurrentUser, db: DBDep):
    count = await service.get_unread_count(db, current_user.id)  # type: ignore[union-attr]
    return schemas.UnreadCountResponse(unread_count=count)  # pragma: no cover


@router.put(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[AuthRequired],
)
async def mark_all_read(current_user: CurrentUser, db: DBDep):
    await service.mark_all_as_read(db, current_user.id)  # type: ignore[union-attr]


@router.put(
    "/{notification_id}/read",
    response_model=schemas.NotificationOut,
    dependencies=[AuthRequired],
)
async def mark_read(notification_id: UUID, current_user: CurrentUser, db: DBDep):
    return await service.mark_as_read(db, notification_id, current_user.id)  # type: ignore[union-attr]
