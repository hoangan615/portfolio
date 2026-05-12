from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.comments import schemas, service
from shared.dependencies import CurrentUser, DBDep, ROLE_HIERARCHY, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/comments", tags=["comments"])

MemberRequired = require_min_role("member")


@router.get("", response_model=PagedResponse[schemas.CommentOut])
async def list_comments(
    db: DBDep,
    content_type: str = Query(..., pattern="^(post|video)$"),
    content_id: UUID = Query(...),
    parent_id: UUID | None = Query(None),
    params: PageParams = Depends(),
):
    items, total = await service.list_comments(db, content_type, content_id, params, parent_id)
    return PagedResponse.create(items, total, params)


@router.post(
    "",
    response_model=schemas.CommentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def create_comment(body: schemas.CommentCreate, current_user: CurrentUser, db: DBDep):
    return await service.create_comment(db, current_user.id, body)  # type: ignore[union-attr]


@router.put("/{comment_id}", response_model=schemas.CommentOut, dependencies=[MemberRequired])
async def update_comment(comment_id: UUID, body: schemas.CommentUpdate, current_user: CurrentUser, db: DBDep):
    return await service.update_comment(db, comment_id, current_user.id, body)  # type: ignore[union-attr]


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: UUID, current_user: CurrentUser, db: DBDep):
    is_mod = ROLE_HIERARCHY.get(current_user.role, 0) >= ROLE_HIERARCHY.get("moderator", 0)  # type: ignore[union-attr]
    await service.delete_comment(db, comment_id, current_user.id, is_mod=is_mod)  # type: ignore[union-attr]
