from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.moderation.models import ModerationAction, Report, UserWarning
from modules.moderation.schemas import ModerationActionCreate, ReportCreate, ReviewReport
from modules.users.models import User
from shared.exceptions import NotFoundError
from shared.pagination import PageParams


async def create_report(db: AsyncSession, reporter_id: UUID, data: ReportCreate) -> Report:
    report = Report(
        reporter_id=reporter_id,
        content_type=data.content_type,
        content_id=data.content_id,
        reason=data.reason,
        description=data.description,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def list_reports(
    db: AsyncSession, params: PageParams, status: str | None = None
) -> tuple[list[Report], int]:
    q = select(Report)
    if status:
        q = q.where(Report.status == status)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Report.created_at.desc()).offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def review_report(
    db: AsyncSession, report_id: UUID, reviewer_id: UUID, data: ReviewReport
) -> Report:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report")
    report.status = data.status
    report.reviewed_by = reviewer_id
    report.reviewed_at = datetime.now(UTC)
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def create_moderation_action(
    db: AsyncSession, moderator_id: UUID, data: ModerationActionCreate
) -> ModerationAction:
    action = ModerationAction(
        moderator_id=moderator_id,
        target_user_id=data.target_user_id,
        action_type=data.action_type,
        reason=data.reason,
        content_type=data.content_type,
        content_id=data.content_id,
        report_id=data.report_id,
    )
    db.add(action)

    # Apply action to user if applicable
    if data.target_user_id and data.action_type in ("ban", "suspend", "restrict"):
        user_result = await db.execute(select(User).where(User.id == data.target_user_id))
        user = user_result.scalar_one_or_none()
        if user:
            if data.action_type == "ban":
                user.role = "banned"
                user.status = "suspended"
            elif data.action_type == "restrict":
                user.role = "restricted"
            db.add(user)

    await db.flush()
    await db.refresh(action)
    return action


async def issue_warning(
    db: AsyncSession, user_id: UUID, issued_by: UUID, reason: str
) -> UserWarning:
    warning = UserWarning(user_id=user_id, issued_by=issued_by, reason=reason)
    db.add(warning)
    await db.flush()
    await db.refresh(warning)
    return warning


async def list_user_warnings(db: AsyncSession, user_id: UUID) -> list[UserWarning]:
    result = await db.execute(
        select(UserWarning)
        .where(UserWarning.user_id == user_id)
        .order_by(UserWarning.created_at.desc())
    )
    return list(result.scalars().all())
