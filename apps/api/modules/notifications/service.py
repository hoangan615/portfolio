from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from modules.notifications.models import Notification
from shared.exceptions import NotFoundError
from shared.pagination import PageParams


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    notification_type: str,
    actor_id: UUID | None = None,
    content_type: str | None = None,
    content_id: UUID | None = None,
    payload: dict[str, Any] | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notification_type,
        actor_id=actor_id,
        content_type=content_type,
        content_id=content_id,
        payload_json=payload,
    )
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def list_notifications(
    db: AsyncSession, user_id: UUID, params: PageParams
) -> tuple[list[Notification], int]:
    q = select(Notification).where(Notification.user_id == user_id)
    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Notification.created_at.desc()).offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def get_unread_count(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id, Notification.read == False  # noqa: E712
        )
    )
    return result.scalar_one()


async def mark_as_read(db: AsyncSession, notification_id: UUID, user_id: UUID) -> Notification:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise NotFoundError("Notification")
    notif.read = True
    db.add(notif)
    await db.flush()
    await db.refresh(notif)
    return notif


async def mark_all_as_read(db: AsyncSession, user_id: UUID) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        .values(read=True)
        .returning(Notification.id)
    )
    await db.flush()
    rows = result.fetchall()
    return len(rows)
