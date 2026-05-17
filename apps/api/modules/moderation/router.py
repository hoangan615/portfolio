from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.moderation import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/moderation", tags=["moderation"])

ModeratorRequired = require_min_role("moderator")
AdminRequired = require_min_role("admin")


@router.post(
    "/reports",
    response_model=schemas.ReportOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[require_min_role("member")],
)
async def create_report(body: schemas.ReportCreate, current_user: CurrentUser, db: DBDep):
    return await service.create_report(db, current_user.id, body)  # type: ignore[union-attr]


@router.get(
    "/reports",
    response_model=PagedResponse[schemas.ReportOut],
    dependencies=[ModeratorRequired],
)
async def list_reports(
    db: DBDep,
    report_status: str | None = Query(None),
    params: PageParams = Depends(),
):
    items, total = await service.list_reports(db, params, status=report_status)
    return PagedResponse.create(items, total, params)  # pragma: no cover


@router.put(
    "/reports/{report_id}",
    response_model=schemas.ReportOut,
    dependencies=[ModeratorRequired],
)
async def review_report(
    report_id: UUID, body: schemas.ReviewReport, current_user: CurrentUser, db: DBDep
):
    return await service.review_report(db, report_id, current_user.id, body)  # type: ignore[union-attr]


@router.post(
    "/actions",
    response_model=schemas.ModerationActionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[ModeratorRequired],
)
async def create_action(body: schemas.ModerationActionCreate, current_user: CurrentUser, db: DBDep):
    return await service.create_moderation_action(db, current_user.id, body)  # type: ignore[union-attr]


@router.post(
    "/warnings",
    response_model=schemas.UserWarningOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[ModeratorRequired],
)
async def issue_warning(
    user_id: UUID,
    reason: str,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.issue_warning(db, user_id, current_user.id, reason)  # type: ignore[union-attr]  # pragma: no cover


@router.get(
    "/warnings/{user_id}",
    response_model=list[schemas.UserWarningOut],
    dependencies=[ModeratorRequired],
)
async def list_user_warnings(user_id: UUID, db: DBDep):
    return await service.list_user_warnings(db, user_id)  # pragma: no cover
