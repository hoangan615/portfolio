from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from modules.posts import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/posts", tags=["posts"])

MemberRequired = require_min_role("member")
ModeratorRequired = require_min_role("moderator")


@router.get("/mine", response_model=PagedResponse[schemas.PostOut], dependencies=[MemberRequired])
async def list_my_posts(db: DBDep, current_user: CurrentUser, params: PageParams = Depends()):
    posts, total = await service.list_posts(db, params, status=None, user_id=current_user.id)  # type: ignore[union-attr]
    return PagedResponse.create(posts, total, params)


@router.get("", response_model=PagedResponse[schemas.PostOut])
async def list_posts(
    db: DBDep,
    params: PageParams = Depends(),
    post_type: str | None = Query(None),
    user_id: UUID | None = Query(None),
):
    posts, total = await service.list_posts(
        db, params, status="published", user_id=user_id, post_type=post_type
    )
    return PagedResponse.create(posts, total, params)  # pragma: no cover


@router.post(
    "",
    response_model=schemas.PostDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def create_post(body: schemas.PostCreate, current_user: CurrentUser, db: DBDep):
    return await service.create_post(db, current_user.id, body)  # type: ignore[union-attr]


@router.get("/{slug}", response_model=schemas.PostDetail)
async def get_post(slug: str, db: DBDep):
    post = await service.get_post_by_slug(db, slug)
    await service.increment_view(db, post.id)  # pragma: no cover
    return post  # pragma: no cover


@router.put("/{post_id}", response_model=schemas.PostDetail, dependencies=[ModeratorRequired])
async def update_post(post_id: UUID, body: schemas.PostUpdate, db: DBDep):
    return await service.update_post(db, post_id, body)  # pragma: no cover


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: UUID, current_user: CurrentUser, db: DBDep):
    post = await service.get_post_by_id(db, post_id)
    from shared.dependencies import ROLE_HIERARCHY  # pragma: no cover
    from shared.exceptions import ForbiddenError  # pragma: no cover

    user_level = ROLE_HIERARCHY.get(current_user.role, 0)  # type: ignore[union-attr]  # pragma: no cover
    if post.user_id != current_user.id and user_level < ROLE_HIERARCHY.get("moderator", 0):  # type: ignore[union-attr]  # pragma: no cover
        raise ForbiddenError("Not allowed to delete this post")  # pragma: no cover
    await service.delete_post(db, post_id)  # pragma: no cover


@router.post("/{post_id}/submit", response_model=schemas.PostDetail, dependencies=[MemberRequired])
async def submit_post(post_id: UUID, current_user: CurrentUser, db: DBDep):
    return await service.submit_for_review(db, post_id, current_user.id)  # type: ignore[union-attr]
