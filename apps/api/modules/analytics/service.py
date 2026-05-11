from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.analytics.models import ContentView
from modules.analytics.schemas import AnalyticsSummary, DailyViewStat, TopContent
from modules.posts.models import Post
from modules.users.models import User
from modules.videos.models import Video


async def record_view(
    db: AsyncSession,
    content_type: str,
    content_id: UUID,
    viewer_id: UUID | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> ContentView:
    ip_hash = hashlib.sha256(ip.encode()).hexdigest() if ip else None
    view = ContentView(
        content_type=content_type,
        content_id=content_id,
        viewer_id=viewer_id,
        ip_hash=ip_hash,
        user_agent=user_agent,
    )
    db.add(view)
    await db.flush()
    return view


async def get_analytics_summary(db: AsyncSession, days: int = 30) -> AnalyticsSummary:
    since = datetime.now(UTC) - timedelta(days=days)

    # Total views
    total_views_result = await db.execute(
        select(func.count(ContentView.id)).where(ContentView.created_at >= since)
    )
    total_views = total_views_result.scalar_one()

    # Total posts (published)
    total_posts_result = await db.execute(
        select(func.count(Post.id)).where(Post.status == "published")
    )
    total_posts = total_posts_result.scalar_one()

    # Total videos (ready)
    total_videos_result = await db.execute(
        select(func.count(Video.id)).where(Video.status == "ready")
    )
    total_videos = total_videos_result.scalar_one()

    # Total users (active)
    total_users_result = await db.execute(
        select(func.count(User.id)).where(User.status == "active")
    )
    total_users = total_users_result.scalar_one()

    # Top posts by views
    top_posts_result = await db.execute(
        select(
            ContentView.content_id,
            func.count(ContentView.id).label("view_count"),
        )
        .where(ContentView.content_type == "post", ContentView.created_at >= since)
        .group_by(ContentView.content_id)
        .order_by(func.count(ContentView.id).desc())
        .limit(10)
    )
    top_posts = [
        TopContent(content_type="post", content_id=row.content_id, view_count=row.view_count)
        for row in top_posts_result.all()
    ]

    # Top videos by views
    top_videos_result = await db.execute(
        select(
            ContentView.content_id,
            func.count(ContentView.id).label("view_count"),
        )
        .where(ContentView.content_type == "video", ContentView.created_at >= since)
        .group_by(ContentView.content_id)
        .order_by(func.count(ContentView.id).desc())
        .limit(10)
    )
    top_videos = [
        TopContent(content_type="video", content_id=row.content_id, view_count=row.view_count)
        for row in top_videos_result.all()
    ]

    # Daily views
    daily_result = await db.execute(
        select(
            cast(ContentView.created_at, Date).label("date"),
            ContentView.content_type,
            func.count(ContentView.id).label("view_count"),
        )
        .where(ContentView.created_at >= since)
        .group_by(cast(ContentView.created_at, Date), ContentView.content_type)
        .order_by(cast(ContentView.created_at, Date).asc())
    )
    daily_views = [
        DailyViewStat(date=row.date, content_type=row.content_type, view_count=row.view_count)
        for row in daily_result.all()
    ]

    return AnalyticsSummary(
        total_views=total_views,
        total_posts=total_posts,
        total_videos=total_videos,
        total_users=total_users,
        top_posts=top_posts,
        top_videos=top_videos,
        daily_views=daily_views,
    )
