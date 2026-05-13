"""Unit tests for notifications/service.py and moderation/service.py."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.moderation.models import Report
from modules.moderation.schemas import ModerationActionCreate, ReportCreate, ReviewReport
from modules.moderation import service as mod_service
from modules.notifications.models import Notification
from modules.notifications import service as notif_service
from modules.users.models import User
from shared.exceptions import NotFoundError
from shared.pagination import PageParams


def _page() -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 20
    return p


# ── Notifications: create_notification ───────────────────────────────────────


@pytest.mark.asyncio
async def test_create_notification(db_session: AsyncSession, regular_user: User, second_user: User):
    notif = await notif_service.create_notification(
        db_session,
        user_id=regular_user.id,
        notification_type="follow",
        actor_id=second_user.id,
    )
    assert notif.user_id == regular_user.id
    assert notif.type == "follow"
    assert notif.actor_id == second_user.id
    assert notif.read is False


@pytest.mark.asyncio
async def test_create_notification_with_payload(db_session: AsyncSession, regular_user: User):
    payload = {"message": "You have a new follower"}
    notif = await notif_service.create_notification(
        db_session,
        user_id=regular_user.id,
        notification_type="system",
        payload=payload,
    )
    assert notif.payload_json == payload


# ── Notifications: list_notifications ────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_notifications(db_session: AsyncSession, regular_user: User):
    n1 = Notification(user_id=regular_user.id, type="like", read=False)
    n2 = Notification(user_id=regular_user.id, type="comment", read=True)
    db_session.add_all([n1, n2])
    await db_session.flush()

    items, total = await notif_service.list_notifications(db_session, regular_user.id, _page())
    assert total == 2


@pytest.mark.asyncio
async def test_list_notifications_empty(db_session: AsyncSession, regular_user: User):
    items, total = await notif_service.list_notifications(db_session, regular_user.id, _page())
    assert total == 0
    assert items == []


# ── Notifications: get_unread_count ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_unread_count(db_session: AsyncSession, regular_user: User):
    n1 = Notification(user_id=regular_user.id, type="like", read=False)
    n2 = Notification(user_id=regular_user.id, type="comment", read=True)
    db_session.add_all([n1, n2])
    await db_session.flush()

    count = await notif_service.get_unread_count(db_session, regular_user.id)
    assert count == 1


# ── Notifications: mark_as_read ───────────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_as_read(db_session: AsyncSession, regular_user: User):
    notif = Notification(user_id=regular_user.id, type="follow", read=False)
    db_session.add(notif)
    await db_session.flush()

    updated = await notif_service.mark_as_read(db_session, notif.id, regular_user.id)
    assert updated.read is True


@pytest.mark.asyncio
async def test_mark_as_read_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await notif_service.mark_as_read(db_session, uuid.uuid4(), regular_user.id)


# ── Notifications: mark_all_as_read ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_mark_all_as_read(db_session: AsyncSession, regular_user: User):
    notifs = [Notification(user_id=regular_user.id, type="like", read=False) for _ in range(3)]
    db_session.add_all(notifs)
    await db_session.flush()

    count = await notif_service.mark_all_as_read(db_session, regular_user.id)
    assert count == 3

    unread = await notif_service.get_unread_count(db_session, regular_user.id)
    assert unread == 0


# ── Moderation: create_report ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_report(db_session: AsyncSession, regular_user: User):
    data = ReportCreate(
        content_type="post",
        content_id=uuid.uuid4(),
        reason="Spam",
    )
    report = await mod_service.create_report(db_session, regular_user.id, data)
    assert report.reporter_id == regular_user.id
    assert report.reason == "Spam"
    assert report.status == "pending"


@pytest.mark.asyncio
async def test_create_report_with_description(db_session: AsyncSession, regular_user: User):
    data = ReportCreate(
        content_type="user",
        content_id=uuid.uuid4(),
        reason="Harassment",
        description="This user is harassing me.",
    )
    report = await mod_service.create_report(db_session, regular_user.id, data)
    assert report.description == "This user is harassing me."


# ── Moderation: list_reports ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_reports(db_session: AsyncSession, regular_user: User):
    r1 = Report(reporter_id=regular_user.id, content_type="post", content_id=uuid.uuid4(), reason="A", status="pending")
    r2 = Report(reporter_id=regular_user.id, content_type="post", content_id=uuid.uuid4(), reason="B", status="reviewed")
    db_session.add_all([r1, r2])
    await db_session.flush()

    reports, total = await mod_service.list_reports(db_session, _page())
    assert total == 2


@pytest.mark.asyncio
async def test_list_reports_filter_status(db_session: AsyncSession, regular_user: User):
    r1 = Report(reporter_id=regular_user.id, content_type="post", content_id=uuid.uuid4(), reason="A", status="pending")
    r2 = Report(reporter_id=regular_user.id, content_type="post", content_id=uuid.uuid4(), reason="B", status="reviewed")
    db_session.add_all([r1, r2])
    await db_session.flush()

    reports, total = await mod_service.list_reports(db_session, _page(), status="pending")
    assert total == 1
    assert reports[0].status == "pending"


# ── Moderation: review_report ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_review_report(db_session: AsyncSession, regular_user: User, second_user: User):
    report = Report(
        reporter_id=regular_user.id,
        content_type="post",
        content_id=uuid.uuid4(),
        reason="Spam",
        status="pending",
    )
    db_session.add(report)
    await db_session.flush()

    data = ReviewReport(status="reviewed")
    updated = await mod_service.review_report(db_session, report.id, second_user.id, data)
    assert updated.status == "reviewed"
    assert updated.reviewed_by == second_user.id


@pytest.mark.asyncio
async def test_review_report_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await mod_service.review_report(
            db_session, uuid.uuid4(), regular_user.id, ReviewReport(status="reviewed")
        )


# ── Moderation: create_moderation_action ─────────────────────────────────────


@pytest.mark.asyncio
async def test_create_moderation_action_warn(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    data = ModerationActionCreate(
        target_user_id=second_user.id,
        action_type="warn",
        reason="First offense",
    )
    action = await mod_service.create_moderation_action(db_session, regular_user.id, data)
    assert action.action_type == "warn"
    assert action.moderator_id == regular_user.id


@pytest.mark.asyncio
async def test_create_moderation_action_restrict_user(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    data = ModerationActionCreate(
        target_user_id=second_user.id,
        action_type="restrict",
        reason="Repeated violations",
    )
    action = await mod_service.create_moderation_action(db_session, regular_user.id, data)
    await db_session.refresh(second_user)
    assert second_user.role == "restricted"


@pytest.mark.asyncio
async def test_create_moderation_action_ban_user(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    data = ModerationActionCreate(
        target_user_id=second_user.id,
        action_type="ban",
        reason="Severe violation",
    )
    await mod_service.create_moderation_action(db_session, regular_user.id, data)
    await db_session.refresh(second_user)
    assert second_user.role == "banned"
    assert second_user.status == "suspended"


@pytest.mark.asyncio
async def test_create_moderation_action_no_user(
    db_session: AsyncSession, regular_user: User
):
    data = ModerationActionCreate(
        action_type="delete_content",
        content_type="post",
        content_id=uuid.uuid4(),
    )
    action = await mod_service.create_moderation_action(db_session, regular_user.id, data)
    assert action.action_type == "delete_content"


# ── Moderation: issue_warning / list_user_warnings ────────────────────────────


@pytest.mark.asyncio
async def test_issue_warning(db_session: AsyncSession, regular_user: User, second_user: User):
    warning = await mod_service.issue_warning(
        db_session, second_user.id, regular_user.id, "Inappropriate language"
    )
    assert warning.user_id == second_user.id
    assert warning.reason == "Inappropriate language"


@pytest.mark.asyncio
async def test_list_user_warnings(db_session: AsyncSession, regular_user: User, second_user: User):
    await mod_service.issue_warning(db_session, second_user.id, regular_user.id, "Warning 1")
    await mod_service.issue_warning(db_session, second_user.id, regular_user.id, "Warning 2")

    warnings = await mod_service.list_user_warnings(db_session, second_user.id)
    assert len(warnings) == 2


@pytest.mark.asyncio
async def test_list_user_warnings_empty(db_session: AsyncSession, regular_user: User):
    warnings = await mod_service.list_user_warnings(db_session, regular_user.id)
    assert warnings == []
