from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, union_all, func, literal, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from modules.feed.schemas import FeedItem
from modules.posts.models import Post, PostTag
from modules.reactions.models import Reaction
from modules.users.models import Follow, TagFollow
from modules.videos.models import Video
from shared.pagination import PageParams


def _post_to_feed_item(post: Post) -> FeedItem:
    return FeedItem(
        id=post.id,
        item_type="post",
        user_id=post.user_id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        cover_image_url=post.cover_image_url,
        thumbnail_url=None,
        view_count=post.view_count,
        published_at=post.published_at,
        created_at=post.created_at,
    )


def _video_to_feed_item(video: Video) -> FeedItem:
    return FeedItem(
        id=video.id,
        item_type="video",
        user_id=video.user_id,
        title=video.title,
        slug=None,
        excerpt=video.description,
        cover_image_url=video.thumbnail_url,
        thumbnail_url=video.thumbnail_url,
        view_count=video.view_count,
        published_at=video.published_at,
        created_at=video.created_at,
    )


async def global_feed(db: AsyncSession, params: PageParams) -> tuple[list[FeedItem], int]:
    """All published posts and videos, newest first."""
    post_q = select(Post).where(Post.status == "published")
    video_q = select(Video).where(Video.status == "ready", Video.visibility == "public")

    post_count = (await db.execute(select(func.count()).select_from(post_q.subquery()))).scalar_one()
    video_count = (await db.execute(select(func.count()).select_from(video_q.subquery()))).scalar_one()
    total = post_count + video_count

    # Fetch both and merge
    post_q = post_q.order_by(Post.published_at.desc().nullslast(), Post.created_at.desc()).limit(params.limit + params.offset)
    video_q = video_q.order_by(Video.published_at.desc().nullslast(), Video.created_at.desc()).limit(params.limit + params.offset)

    posts = list((await db.execute(post_q)).scalars().all())
    videos = list((await db.execute(video_q)).scalars().all())

    items: list[FeedItem] = []
    items.extend(_post_to_feed_item(p) for p in posts)
    items.extend(_video_to_feed_item(v) for v in videos)

    items.sort(
        key=lambda x: x.published_at or x.created_at,
        reverse=True,
    )
    return items[params.offset: params.offset + params.limit], total


async def following_feed(db: AsyncSession, user_id: UUID, params: PageParams) -> tuple[list[FeedItem], int]:
    """Posts and videos from followed users."""
    followed_q = select(Follow.following_id).where(Follow.follower_id == user_id)

    post_q = select(Post).where(Post.status == "published", Post.user_id.in_(followed_q))
    video_q = select(Video).where(
        Video.status == "ready",
        Video.visibility == "public",
        Video.user_id.in_(followed_q),
    )

    post_count = (await db.execute(select(func.count()).select_from(post_q.subquery()))).scalar_one()
    video_count = (await db.execute(select(func.count()).select_from(video_q.subquery()))).scalar_one()
    total = post_count + video_count

    posts = list((await db.execute(post_q.order_by(Post.published_at.desc().nullslast()))).scalars().all())
    videos = list((await db.execute(video_q.order_by(Video.published_at.desc().nullslast()))).scalars().all())

    items: list[FeedItem] = []
    items.extend(_post_to_feed_item(p) for p in posts)
    items.extend(_video_to_feed_item(v) for v in videos)
    items.sort(key=lambda x: x.published_at or x.created_at, reverse=True)
    return items[params.offset: params.offset + params.limit], total


async def trending_feed(db: AsyncSession, params: PageParams) -> tuple[list[FeedItem], int]:
    """Top content by views + reactions in last 24h."""
    since = datetime.now(UTC) - timedelta(hours=24)

    post_q = select(Post).where(
        Post.status == "published",
        Post.published_at >= since,
    ).order_by(Post.view_count.desc())

    video_q = select(Video).where(
        Video.status == "ready",
        Video.visibility == "public",
        Video.published_at >= since,
    ).order_by(Video.view_count.desc())

    post_count = (await db.execute(select(func.count()).select_from(post_q.subquery()))).scalar_one()
    video_count = (await db.execute(select(func.count()).select_from(video_q.subquery()))).scalar_one()
    total = post_count + video_count

    posts = list((await db.execute(post_q)).scalars().all())
    videos = list((await db.execute(video_q)).scalars().all())

    items: list[FeedItem] = []
    items.extend(_post_to_feed_item(p) for p in posts)
    items.extend(_video_to_feed_item(v) for v in videos)
    items.sort(key=lambda x: x.view_count, reverse=True)
    return items[params.offset: params.offset + params.limit], total


async def explore_feed(db: AsyncSession, user_id: UUID, params: PageParams) -> tuple[list[FeedItem], int]:
    """Posts matching tags the user follows."""
    followed_tags_q = select(TagFollow.tag_id).where(TagFollow.user_id == user_id)

    post_q = select(Post).where(
        Post.status == "published",
        Post.id.in_(
            select(PostTag.post_id).where(PostTag.tag_id.in_(followed_tags_q))
        ),
    )

    post_count = (await db.execute(select(func.count()).select_from(post_q.subquery()))).scalar_one()

    posts = list(
        (await db.execute(
            post_q.order_by(Post.published_at.desc().nullslast()).offset(params.offset).limit(params.limit)
        )).scalars().all()
    )

    items = [_post_to_feed_item(p) for p in posts]
    return items, post_count
