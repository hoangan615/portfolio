from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from slugify import slugify
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post, PostCategory, PostTag
from modules.posts.schemas import PostCreate, PostUpdate
from shared.exceptions import ConflictError, NotFoundError
from shared.pagination import PageParams


async def _make_unique_slug(db: AsyncSession, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Post).where(Post.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def create_post(db: AsyncSession, user_id: UUID, data: PostCreate) -> Post:
    base_slug = data.slug or slugify(data.title or f"post-{user_id}")
    slug = await _make_unique_slug(db, base_slug)

    post = Post(
        user_id=user_id,
        type=data.type,
        title=data.title,
        slug=slug,
        content=data.content,
        excerpt=data.excerpt,
        cover_image_url=data.cover_image_url,
        status="draft",
        scheduled_at=data.scheduled_at,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)

    for cat_id in data.category_ids:
        db.add(PostCategory(post_id=post.id, category_id=cat_id))
    for tag_id in data.tag_ids:
        db.add(PostTag(post_id=post.id, tag_id=tag_id))
    await db.flush()

    return post


async def get_post_by_slug(db: AsyncSession, slug: str) -> Post:
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        raise NotFoundError("Post")
    return post


async def get_post_by_id(db: AsyncSession, post_id: UUID) -> Post:
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise NotFoundError("Post")
    return post


async def list_posts(
    db: AsyncSession,
    params: PageParams,
    status: str | None = "published",
    user_id: UUID | None = None,
    post_type: str | None = None,
) -> tuple[list[Post], int]:
    q = select(Post)
    if status:
        q = q.where(Post.status == status)
    if user_id:
        q = q.where(Post.user_id == user_id)
    if post_type:
        q = q.where(Post.type == post_type)

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar_one()

    q = q.order_by(Post.published_at.desc().nullslast(), Post.created_at.desc())
    q = q.offset(params.offset).limit(params.limit)
    result = await db.execute(q)
    return list(result.scalars().all()), total


async def update_post(db: AsyncSession, post_id: UUID, data: PostUpdate) -> Post:
    post = await get_post_by_id(db, post_id)
    changes = data.model_dump(exclude_none=True, exclude={"category_ids", "tag_ids"})

    if "slug" in changes:
        # Ensure new slug is unique (unless same)
        new_slug = changes["slug"]
        if new_slug != post.slug:
            existing = await db.execute(select(Post).where(Post.slug == new_slug))
            if existing.scalar_one_or_none():
                raise ConflictError("Slug already in use")

    if changes.get("status") == "published" and not post.published_at:
        changes["published_at"] = datetime.now(UTC)

    for field, value in changes.items():
        setattr(post, field, value)
    db.add(post)
    await db.flush()

    # Update categories if provided
    if data.category_ids is not None:
        await db.execute(
            PostCategory.__table__.delete().where(PostCategory.post_id == post_id)
        )
        for cat_id in data.category_ids:
            db.add(PostCategory(post_id=post_id, category_id=cat_id))

    # Update tags if provided
    if data.tag_ids is not None:
        await db.execute(
            PostTag.__table__.delete().where(PostTag.post_id == post_id)
        )
        for tag_id in data.tag_ids:
            db.add(PostTag(post_id=post_id, tag_id=tag_id))

    await db.flush()
    await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post_id: UUID) -> None:
    post = await get_post_by_id(db, post_id)
    await db.delete(post)
    await db.flush()


async def increment_view(db: AsyncSession, post_id: UUID) -> None:
    await db.execute(
        update(Post).where(Post.id == post_id).values(view_count=Post.view_count + 1)
    )
    await db.flush()


async def submit_for_review(db: AsyncSession, post_id: UUID, user_id: UUID) -> Post:
    post = await get_post_by_id(db, post_id)
    if post.user_id != user_id:
        from shared.exceptions import ForbiddenError
        raise ForbiddenError("Not your post")
    if post.status not in ("draft", "rejected"):
        from shared.exceptions import BadRequestError
        raise BadRequestError(f"Cannot submit post with status '{post.status}' for review")
    post.status = "pending_review"
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def publish_post(db: AsyncSession, post_id: UUID, user_id: UUID) -> Post:
    post = await get_post_by_id(db, post_id)
    if post.user_id != user_id:
        from shared.exceptions import ForbiddenError
        raise ForbiddenError("Not your post")
    if post.status == "published":
        return post
    post.status = "published"
    if not post.published_at:
        post.published_at = datetime.now(UTC)
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post
