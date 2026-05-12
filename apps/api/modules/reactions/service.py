from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.reactions.models import Bookmark, Reaction
from modules.reactions.schemas import BookmarkCreate, ReactionCreate, ReactionSummary
from shared.exceptions import ConflictError, NotFoundError


async def add_reaction(db: AsyncSession, user_id: UUID, data: ReactionCreate) -> Reaction:
    existing = await db.execute(
        select(Reaction).where(
            Reaction.content_type == data.content_type,
            Reaction.content_id == data.content_id,
            Reaction.user_id == user_id,
            Reaction.emoji == data.emoji,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Already reacted with this emoji")

    reaction = Reaction(
        content_type=data.content_type,
        content_id=data.content_id,
        user_id=user_id,
        emoji=data.emoji,
    )
    db.add(reaction)
    await db.flush()
    await db.refresh(reaction)
    return reaction


async def remove_reaction(db: AsyncSession, user_id: UUID, reaction_id: UUID) -> None:
    result = await db.execute(
        select(Reaction).where(Reaction.id == reaction_id, Reaction.user_id == user_id)
    )
    reaction = result.scalar_one_or_none()
    if not reaction:
        raise NotFoundError("Reaction")
    await db.delete(reaction)
    await db.flush()


async def get_reaction_summary(
    db: AsyncSession, content_type: str, content_id: UUID
) -> list[ReactionSummary]:
    result = await db.execute(
        select(Reaction.emoji, func.count(Reaction.id).label("count"))
        .where(Reaction.content_type == content_type, Reaction.content_id == content_id)
        .group_by(Reaction.emoji)
        .order_by(func.count(Reaction.id).desc())
    )
    rows = result.all()
    return [ReactionSummary(emoji=row.emoji, count=row.count) for row in rows]


async def add_bookmark(db: AsyncSession, user_id: UUID, data: BookmarkCreate) -> Bookmark:
    existing = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user_id,
            Bookmark.content_type == data.content_type,
            Bookmark.content_id == data.content_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Already bookmarked")

    bookmark = Bookmark(
        user_id=user_id,
        content_type=data.content_type,
        content_id=data.content_id,
    )
    db.add(bookmark)
    await db.flush()
    await db.refresh(bookmark)
    return bookmark


async def remove_bookmark(db: AsyncSession, user_id: UUID, bookmark_id: UUID) -> None:
    result = await db.execute(
        select(Bookmark).where(Bookmark.id == bookmark_id, Bookmark.user_id == user_id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise NotFoundError("Bookmark")
    await db.delete(bookmark)
    await db.flush()


async def list_bookmarks(
    db: AsyncSession,
    user_id: UUID,
    content_type: str | None = None,
) -> list[Bookmark]:
    q = select(Bookmark).where(Bookmark.user_id == user_id)
    if content_type:
        q = q.where(Bookmark.content_type == content_type)
    q = q.order_by(Bookmark.created_at.desc())
    result = await db.execute(q)
    return list(result.scalars().all())
