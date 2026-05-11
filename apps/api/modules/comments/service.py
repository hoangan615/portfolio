from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.comments.models import Comment
from modules.comments.schemas import CommentCreate, CommentUpdate
from shared.exceptions import ForbiddenError, NotFoundError
from shared.pagination import PageParams


async def create_comment(db: AsyncSession, user_id: UUID, data: CommentCreate) -> Comment:
    comment = Comment(
        content_type=data.content_type,
        content_id=data.content_id,
        user_id=user_id,
        parent_id=data.parent_id,
        body=data.body,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


async def get_comment(db: AsyncSession, comment_id: UUID) -> Comment:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise NotFoundError("Comment")
    return comment


async def list_comments(
    db: AsyncSession,
    content_type: str,
    content_id: UUID,
    params: PageParams,
    parent_id: UUID | None = None,
) -> tuple[list[Comment], int]:
    q = select(Comment).where(
        Comment.content_type == content_type,
        Comment.content_id == content_id,
        Comment.deleted_at.is_(None),
    )
    if parent_id is None:
        q = q.where(Comment.parent_id.is_(None))
    else:
        q = q.where(Comment.parent_id == parent_id)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Comment.created_at.asc()).offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def update_comment(
    db: AsyncSession, comment_id: UUID, user_id: UUID, data: CommentUpdate
) -> Comment:
    comment = await get_comment(db, comment_id)
    if comment.user_id != user_id:
        raise ForbiddenError("Not your comment")
    if comment.deleted_at:
        raise ForbiddenError("Comment is deleted")
    comment.body = data.body
    comment.edited_at = datetime.now(UTC)
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment_id: UUID, user_id: UUID, is_mod: bool = False) -> None:
    comment = await get_comment(db, comment_id)
    if comment.user_id != user_id and not is_mod:
        raise ForbiddenError("Not your comment")
    comment.deleted_at = datetime.now(UTC)
    comment.body = "[deleted]"
    db.add(comment)
    await db.flush()
