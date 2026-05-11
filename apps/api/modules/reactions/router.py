from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Query, status

from modules.reactions import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role

router = APIRouter(tags=["reactions"])

MemberRequired = require_min_role("member")


# ── Reactions ─────────────────────────────────────────────────────────────────

@router.post(
    "/reactions",
    response_model=schemas.ReactionOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def add_reaction(body: schemas.ReactionCreate, current_user: CurrentUser, db: DBDep):
    return await service.add_reaction(db, current_user.id, body)  # type: ignore[union-attr]


@router.delete(
    "/reactions/{reaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[MemberRequired],
)
async def remove_reaction(reaction_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.remove_reaction(db, current_user.id, reaction_id)  # type: ignore[union-attr]


@router.get("/reactions/summary", response_model=list[schemas.ReactionSummary])
async def reaction_summary(
    db: DBDep,
    content_type: str = Query(..., pattern="^(post|video|comment)$"),
    content_id: UUID = Query(...),
):
    return await service.get_reaction_summary(db, content_type, content_id)


# ── Bookmarks ─────────────────────────────────────────────────────────────────

@router.get("/bookmarks", response_model=list[schemas.BookmarkOut], dependencies=[MemberRequired])
async def list_bookmarks(
    current_user: CurrentUser,
    db: DBDep,
    content_type: str | None = Query(None),
):
    return await service.list_bookmarks(db, current_user.id, content_type)  # type: ignore[union-attr]


@router.post(
    "/bookmarks",
    response_model=schemas.BookmarkOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def add_bookmark(body: schemas.BookmarkCreate, current_user: CurrentUser, db: DBDep):
    return await service.add_bookmark(db, current_user.id, body)  # type: ignore[union-attr]


@router.delete(
    "/bookmarks/{bookmark_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[MemberRequired],
)
async def remove_bookmark(bookmark_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.remove_bookmark(db, current_user.id, bookmark_id)  # type: ignore[union-attr]
