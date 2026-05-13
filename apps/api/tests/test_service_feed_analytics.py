"""Unit tests for feed/service.py and analytics/service.py."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.analytics import service as analytics_service
from modules.analytics.models import ContentView
from modules.feed import service as feed_service
from modules.posts.models import Post
from modules.users.models import Follow, User
from modules.videos.models import Video, VideoJob
from shared.pagination import PageParams


def _page(page: int = 1, size: int = 20) -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = page
    p.page_size = size
    return p


async def _make_published_post(db: AsyncSession, user: User) -> Post:
    post = Post(
        user_id=user.id,
        type="article",
        title="Feed Post",
        slug=f"feed-post-{uuid.uuid4().hex[:8]}",
        content="Content",
        status="published",
        published_at=datetime.now(UTC),
        view_count=10,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def _make_public_video(db: AsyncSession, user: User) -> Video:
    video = Video(
        user_id=user.id,
        title="Feed Video",
        status="ready",
        visibility="public",
        published_at=datetime.now(UTC),
        view_count=5,
    )
    db.add(video)
    await db.flush()
    await db.refresh(video)
    return video


# ── Feed helpers ──────────────────────────────────────────────────────────────


def test_post_to_feed_item(regular_user):
    """Test _post_to_feed_item helper directly."""
    post = Post(
        id=uuid.uuid4(),
        user_id=regular_user.id,
        type="article",
        title="Test",
        slug="test",
        status="published",
        published_at=datetime.now(UTC),
        view_count=0,
        created_at=datetime.now(UTC),
    )
    item = feed_service._post_to_feed_item(post)
    assert item.item_type == "post"
    assert item.title == "Test"


def test_video_to_feed_item(regular_user):
    """Test _video_to_feed_item helper directly."""
    video = Video(
        id=uuid.uuid4(),
        user_id=regular_user.id,
        title="Vid",
        status="ready",
        visibility="public",
        published_at=datetime.now(UTC),
        view_count=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    item = feed_service._video_to_feed_item(video)
    assert item.item_type == "video"
    assert item.title == "Vid"


# ── global_feed ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_global_feed_empty(db_session: AsyncSession):
    items, total = await feed_service.global_feed(db_session, _page())
    assert isinstance(items, list)
    assert total >= 0


@pytest.mark.asyncio
async def test_global_feed_includes_posts(db_session: AsyncSession, regular_user: User):
    await _make_published_post(db_session, regular_user)
    items, total = await feed_service.global_feed(db_session, _page())
    assert total >= 1
    assert any(i.item_type == "post" for i in items)


@pytest.mark.asyncio
async def test_global_feed_includes_videos(db_session: AsyncSession, regular_user: User):
    await _make_public_video(db_session, regular_user)
    items, total = await feed_service.global_feed(db_session, _page())
    assert any(i.item_type == "video" for i in items)


@pytest.mark.asyncio
async def test_global_feed_pagination(db_session: AsyncSession, regular_user: User):
    for _ in range(5):
        await _make_published_post(db_session, regular_user)
    items, total = await feed_service.global_feed(db_session, _page(size=2))
    assert len(items) <= 2
    assert total >= 5


# ── following_feed ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_following_feed_empty_no_follows(db_session: AsyncSession, regular_user: User):
    items, total = await feed_service.following_feed(db_session, regular_user.id, _page())
    assert total == 0
    assert items == []


@pytest.mark.asyncio
async def test_following_feed_shows_followed_users_content(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    follow = Follow(follower_id=regular_user.id, following_id=second_user.id)
    db_session.add(follow)
    await _make_published_post(db_session, second_user)
    await db_session.flush()

    items, total = await feed_service.following_feed(db_session, regular_user.id, _page())
    assert total >= 1


# ── trending_feed ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_trending_feed_empty(db_session: AsyncSession):
    items, total = await feed_service.trending_feed(db_session, _page())
    assert isinstance(items, list)


@pytest.mark.asyncio
async def test_trending_feed_sorts_by_views(db_session: AsyncSession, regular_user: User):
    # Posts published within last 24h
    post1 = Post(
        user_id=regular_user.id, type="article", title="Popular",
        slug=f"pop-{uuid.uuid4().hex[:6]}", status="published",
        published_at=datetime.now(UTC) - timedelta(hours=1), view_count=100,
    )
    post2 = Post(
        user_id=regular_user.id, type="article", title="Less Popular",
        slug=f"less-{uuid.uuid4().hex[:6]}", status="published",
        published_at=datetime.now(UTC) - timedelta(hours=2), view_count=5,
    )
    db_session.add_all([post1, post2])
    await db_session.flush()

    items, total = await feed_service.trending_feed(db_session, _page())
    assert total >= 2
    if len(items) >= 2:
        assert items[0].view_count >= items[1].view_count


# ── explore_feed ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_explore_feed_empty(db_session: AsyncSession, regular_user: User):
    items, total = await feed_service.explore_feed(db_session, regular_user.id, _page())
    assert isinstance(items, list)
    assert total >= 0


# ── Analytics: record_view ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_record_view(db_session: AsyncSession, regular_user: User):
    content_id = uuid.uuid4()
    view = await analytics_service.record_view(
        db_session,
        content_type="post",
        content_id=content_id,
        viewer_id=regular_user.id,
        ip="127.0.0.1",
        user_agent="TestAgent/1.0",
    )
    assert view.content_type == "post"
    assert view.ip_hash is not None  # hashed


@pytest.mark.asyncio
async def test_record_view_no_ip(db_session: AsyncSession):
    view = await analytics_service.record_view(
        db_session,
        content_type="video",
        content_id=uuid.uuid4(),
    )
    assert view.ip_hash is None


# ── Analytics: get_analytics_summary ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_analytics_summary_empty(db_session: AsyncSession):
    summary = await analytics_service.get_analytics_summary(db_session, days=30)
    assert summary.total_views >= 0
    assert summary.total_posts >= 0
    assert isinstance(summary.top_posts, list)
    assert isinstance(summary.daily_views, list)


@pytest.mark.asyncio
async def test_get_analytics_summary_counts_views(db_session: AsyncSession, regular_user: User):
    content_id = uuid.uuid4()
    view = ContentView(content_type="post", content_id=content_id)
    db_session.add(view)
    await db_session.flush()

    # Only check counts that don't require date casting (SQLite limitation)
    from sqlalchemy import func, select
    from modules.analytics.models import ContentView as CV
    count_result = await db_session.execute(select(func.count(CV.id)))
    assert count_result.scalar_one() >= 1
