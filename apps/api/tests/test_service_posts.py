"""Unit tests for modules/posts/service.py — direct service calls."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.posts.models import Post
from modules.posts.schemas import PostCreate, PostUpdate
from modules.posts import service
from modules.users.models import User
from shared.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from shared.pagination import PageParams


def _page(page: int = 1, size: int = 20) -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = page
    p.page_size = size
    return p


async def _make_post(
    db: AsyncSession,
    user: User,
    *,
    status: str = "draft",
    slug: str | None = None,
) -> Post:
    post = Post(
        user_id=user.id,
        type="article",
        title="Test Post",
        slug=slug or f"test-post-{uuid.uuid4().hex[:8]}",
        content="<p>Content</p>",
        status=status,
        published_at=datetime.now(UTC) if status == "published" else None,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


# ── create_post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_post_with_title(db_session: AsyncSession, regular_user: User):
    data = PostCreate(type="article", title="My Article", content="Hello world")
    post = await service.create_post(db_session, regular_user.id, data)
    assert post.title == "My Article"
    assert post.status == "draft"
    assert "my-article" in post.slug


@pytest.mark.asyncio
async def test_create_post_custom_slug(db_session: AsyncSession, regular_user: User):
    data = PostCreate(type="article", title="T", slug="custom-slug-abc")
    post = await service.create_post(db_session, regular_user.id, data)
    assert post.slug == "custom-slug-abc"


@pytest.mark.asyncio
async def test_create_post_slug_dedup(db_session: AsyncSession, regular_user: User):
    data1 = PostCreate(type="article", title="Dupe", slug="dupe-slug")
    post1 = await service.create_post(db_session, regular_user.id, data1)
    data2 = PostCreate(type="article", title="Dupe", slug="dupe-slug")
    post2 = await service.create_post(db_session, regular_user.id, data2)
    assert post1.slug != post2.slug
    assert "dupe-slug" in post2.slug


@pytest.mark.asyncio
async def test_create_post_no_title(db_session: AsyncSession, regular_user: User):
    data = PostCreate(type="short", content="short note")
    post = await service.create_post(db_session, regular_user.id, data)
    assert post.slug  # auto-generated from user_id


# ── get_post_by_slug / get_post_by_id ─────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_post_by_slug_found(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, slug="find-by-slug")
    found = await service.get_post_by_slug(db_session, "find-by-slug")
    assert found.id == post.id


@pytest.mark.asyncio
async def test_get_post_by_slug_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.get_post_by_slug(db_session, "no-such-slug")


@pytest.mark.asyncio
async def test_get_post_by_id_found(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    found = await service.get_post_by_id(db_session, post.id)
    assert found.id == post.id


@pytest.mark.asyncio
async def test_get_post_by_id_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.get_post_by_id(db_session, uuid.uuid4())


# ── list_posts ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_posts_all(db_session: AsyncSession, regular_user: User):
    await _make_post(db_session, regular_user, status="published")
    await _make_post(db_session, regular_user, status="published")
    posts, total = await service.list_posts(db_session, _page(), status="published")
    assert total >= 2


@pytest.mark.asyncio
async def test_list_posts_filter_by_user(db_session: AsyncSession, regular_user: User, second_user: User):
    await _make_post(db_session, regular_user, status="published")
    await _make_post(db_session, second_user, status="published")
    posts, total = await service.list_posts(db_session, _page(), user_id=regular_user.id)
    assert all(p.user_id == regular_user.id for p in posts)


@pytest.mark.asyncio
async def test_list_posts_filter_by_type(db_session: AsyncSession, regular_user: User):
    article = Post(
        user_id=regular_user.id, type="article", title="A",
        slug=f"art-{uuid.uuid4().hex[:6]}", status="published",
        published_at=datetime.now(UTC),
    )
    short = Post(
        user_id=regular_user.id, type="short", title="S",
        slug=f"sht-{uuid.uuid4().hex[:6]}", status="published",
        published_at=datetime.now(UTC),
    )
    db_session.add_all([article, short])
    await db_session.flush()

    posts, total = await service.list_posts(db_session, _page(), post_type="short")
    assert all(p.type == "short" for p in posts)


@pytest.mark.asyncio
async def test_list_posts_no_status_filter(db_session: AsyncSession, regular_user: User):
    await _make_post(db_session, regular_user, status="draft")
    posts, total = await service.list_posts(db_session, _page(), status=None)
    assert total >= 1


# ── update_post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_post_title(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = PostUpdate(title="Updated Title")
    updated = await service.update_post(db_session, post.id, data)
    assert updated.title == "Updated Title"


@pytest.mark.asyncio
async def test_update_post_publish_sets_published_at(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, status="draft")
    assert post.published_at is None
    data = PostUpdate(status="published")
    updated = await service.update_post(db_session, post.id, data)
    assert updated.published_at is not None


@pytest.mark.asyncio
async def test_update_post_slug_conflict(db_session: AsyncSession, regular_user: User):
    post1 = await _make_post(db_session, regular_user, slug="slug-one")
    post2 = await _make_post(db_session, regular_user, slug="slug-two")
    with pytest.raises(ConflictError):
        await service.update_post(db_session, post2.id, PostUpdate(slug="slug-one"))


@pytest.mark.asyncio
async def test_update_post_same_slug_no_conflict(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, slug="same-slug")
    updated = await service.update_post(db_session, post.id, PostUpdate(slug="same-slug"))
    assert updated.slug == "same-slug"


@pytest.mark.asyncio
async def test_update_post_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.update_post(db_session, uuid.uuid4(), PostUpdate(title="X"))


# ── delete_post ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_post(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    await service.delete_post(db_session, post.id)
    with pytest.raises(NotFoundError):
        await service.get_post_by_id(db_session, post.id)


# ── increment_view ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_increment_view(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    assert post.view_count == 0
    await service.increment_view(db_session, post.id)
    await db_session.refresh(post)
    assert post.view_count == 1


# ── submit_for_review ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_submit_for_review_success(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, status="draft")
    submitted = await service.submit_for_review(db_session, post.id, regular_user.id)
    assert submitted.status == "pending_review"


@pytest.mark.asyncio
async def test_submit_rejected_post(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, status="rejected")
    # Need to set status manually since _make_post doesn't support "rejected"
    post.status = "rejected"
    await db_session.flush()
    submitted = await service.submit_for_review(db_session, post.id, regular_user.id)
    assert submitted.status == "pending_review"


@pytest.mark.asyncio
async def test_submit_not_owner_raises(db_session: AsyncSession, regular_user: User, second_user: User):
    post = await _make_post(db_session, second_user, status="draft")
    with pytest.raises(ForbiddenError):
        await service.submit_for_review(db_session, post.id, regular_user.id)


@pytest.mark.asyncio
async def test_submit_already_published_raises(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user, status="published")
    with pytest.raises(BadRequestError):
        await service.submit_for_review(db_session, post.id, regular_user.id)


# ── create_post with categories and tags ─────────────────────────────────────


@pytest.mark.asyncio
async def test_create_post_with_category_and_tag(db_session: AsyncSession, regular_user: User):
    import uuid
    from modules.posts.models import Category, Tag
    from modules.posts.schemas import PostCreate

    cat = Category(id=uuid.uuid4(), name="Tech", slug="tech")
    tag = Tag(id=uuid.uuid4(), name="Python", slug="python")
    db_session.add(cat)
    db_session.add(tag)
    await db_session.flush()

    data = PostCreate(
        type="article",
        title="Post with Categories",
        content="<p>Content</p>",
        category_ids=[cat.id],
        tag_ids=[tag.id],
    )
    post = await service.create_post(db_session, regular_user.id, data)
    assert post.title == "Post with Categories"


# ── update_post with categories and tags ─────────────────────────────────────


@pytest.mark.asyncio
async def test_update_post_with_category_and_tag(db_session: AsyncSession, regular_user: User):
    import uuid
    from modules.posts.models import Category, Tag
    from modules.posts.schemas import PostUpdate

    cat = Category(id=uuid.uuid4(), name="Science", slug="science")
    tag = Tag(id=uuid.uuid4(), name="Research", slug="research")
    db_session.add(cat)
    db_session.add(tag)
    await db_session.flush()

    post = await _make_post(db_session, regular_user, status="draft")
    update = PostUpdate(
        category_ids=[cat.id],
        tag_ids=[tag.id],
    )
    updated = await service.update_post(db_session, post.id, update)
    assert updated.id == post.id
