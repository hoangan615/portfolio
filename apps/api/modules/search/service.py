from __future__ import annotations

from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post
from modules.search.schemas import SearchResponse, SearchResultPost, SearchResultUser
from modules.users.models import User
from shared.pagination import PageParams


async def search(
    db: AsyncSession,
    query: str,
    search_type: str | None,
    params: PageParams,
) -> SearchResponse:
    q = query.strip()
    posts: list[SearchResultPost] = []
    users: list[SearchResultUser] = []
    total_posts = 0
    total_users = 0

    if not q:
        return SearchResponse(
            posts=posts,
            users=users,
            total_posts=0,
            total_users=0,
            query=q,
            page=params.page,
            page_size=params.page_size,
        )

    # PostgreSQL full-text search using plainto_tsquery
    ts_query = func.plainto_tsquery("english", q)  # pragma: no cover

    if not search_type or search_type == "post":  # pragma: no cover
        post_ts_vector = func.to_tsvector(
            "english",
            func.coalesce(Post.title, "") + " " + func.coalesce(Post.excerpt, ""),
        )
        post_q = select(Post).where(
            Post.status == "published",
            post_ts_vector.op("@@")(ts_query),
        )

        count_result = await db.execute(select(func.count()).select_from(post_q.subquery()))
        total_posts = count_result.scalar_one()

        result = await db.execute(
            post_q.order_by(Post.published_at.desc().nullslast())
            .offset(params.offset)
            .limit(params.limit)
        )
        posts = [
            SearchResultPost(
                id=p.id,
                type=p.type,
                title=p.title,
                slug=p.slug,
                excerpt=p.excerpt,
                cover_image_url=p.cover_image_url,
                user_id=p.user_id,
                view_count=p.view_count,
                published_at=p.published_at,
                created_at=p.created_at,
            )
            for p in result.scalars().all()
        ]

    if not search_type or search_type == "user":  # pragma: no cover
        user_ts_vector = func.to_tsvector(
            "english",
            func.coalesce(User.username, "")
            + " "
            + func.coalesce(User.display_name, "")
            + " "
            + func.coalesce(User.bio, ""),
        )
        user_q = select(User).where(
            User.status == "active",
            or_(
                user_ts_vector.op("@@")(ts_query),
                User.username.ilike(f"%{q}%"),
                User.display_name.ilike(f"%{q}%"),
            ),
        )

        count_result = await db.execute(select(func.count()).select_from(user_q.subquery()))
        total_users = count_result.scalar_one()

        result = await db.execute(
            user_q.order_by(User.follower_count.desc())
            .offset(params.offset)
            .limit(params.limit)
        )
        users = [
            SearchResultUser(
                id=u.id,
                username=u.username,
                display_name=u.display_name,
                avatar_url=u.avatar_url,
                bio=u.bio,
                follower_count=u.follower_count,
                created_at=u.created_at,
            )
            for u in result.scalars().all()
        ]

    return SearchResponse(  # pragma: no cover
        posts=posts,
        users=users,
        total_posts=total_posts,
        total_users=total_users,
        query=q,
        page=params.page,
        page_size=params.page_size,
    )
