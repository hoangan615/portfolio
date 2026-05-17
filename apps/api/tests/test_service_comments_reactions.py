"""Unit tests for comments/service.py and reactions/service.py."""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.comments.models import Comment
from modules.comments.schemas import CommentCreate, CommentUpdate
from modules.comments import service as comment_service
from modules.posts.models import Post
from modules.reactions.models import Bookmark, Reaction
from modules.reactions.schemas import BookmarkCreate, ReactionCreate
from modules.reactions import service as reaction_service
from modules.users.models import User
from shared.exceptions import ConflictError, ForbiddenError, NotFoundError
from shared.pagination import PageParams


def _page() -> PageParams:
    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 20
    return p


async def _make_post(db: AsyncSession, user: User) -> Post:
    post = Post(
        user_id=user.id,
        type="article",
        title="Post",
        slug=f"post-{uuid.uuid4().hex[:8]}",
        status="published",
        published_at=datetime.now(UTC),
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def _make_comment(db: AsyncSession, user: User, post: Post) -> Comment:
    comment = Comment(
        user_id=user.id,
        content_type="post",
        content_id=post.id,
        body="A comment.",
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


# ── Comments: create ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_comment(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = CommentCreate(content_type="post", content_id=post.id, body="Hello!")
    comment = await comment_service.create_comment(db_session, regular_user.id, data)
    assert comment.body == "Hello!"
    assert comment.user_id == regular_user.id


@pytest.mark.asyncio
async def test_create_reply_comment(db_session: AsyncSession, regular_user: User, second_user: User):
    post = await _make_post(db_session, regular_user)
    parent = await _make_comment(db_session, regular_user, post)
    data = CommentCreate(
        content_type="post", content_id=post.id, parent_id=parent.id, body="Reply"
    )
    reply = await comment_service.create_comment(db_session, second_user.id, data)
    assert reply.parent_id == parent.id


# ── Comments: get_comment ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_comment_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await comment_service.get_comment(db_session, uuid.uuid4())


# ── Comments: list_comments ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_comments_with_parent_filter(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    parent = await _make_comment(db_session, regular_user, post)
    reply_data = CommentCreate(
        content_type="post", content_id=post.id, parent_id=parent.id, body="Reply"
    )
    await comment_service.create_comment(db_session, regular_user.id, reply_data)

    replies, total = await comment_service.list_comments(
        db_session, "post", post.id, _page(), parent_id=parent.id
    )
    assert total == 1
    assert replies[0].parent_id == parent.id


@pytest.mark.asyncio
async def test_list_comments_top_level_only(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    top = await _make_comment(db_session, regular_user, post)
    reply_data = CommentCreate(
        content_type="post", content_id=post.id, parent_id=top.id, body="Reply"
    )
    await comment_service.create_comment(db_session, regular_user.id, reply_data)

    top_comments, total = await comment_service.list_comments(
        db_session, "post", post.id, _page()
    )
    assert all(c.parent_id is None for c in top_comments)


# ── Comments: update_comment ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_comment_success(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)

    updated = await comment_service.update_comment(
        db_session, comment.id, regular_user.id, CommentUpdate(body="Edited body")
    )
    assert updated.body == "Edited body"
    assert updated.edited_at is not None


@pytest.mark.asyncio
async def test_update_comment_wrong_user(db_session: AsyncSession, regular_user: User, second_user: User):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)

    with pytest.raises(ForbiddenError):
        await comment_service.update_comment(
            db_session, comment.id, second_user.id, CommentUpdate(body="Hacked")
        )


@pytest.mark.asyncio
async def test_update_deleted_comment_forbidden(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)
    comment.deleted_at = datetime.now(UTC)
    await db_session.flush()

    with pytest.raises(ForbiddenError):
        await comment_service.update_comment(
            db_session, comment.id, regular_user.id, CommentUpdate(body="Update deleted")
        )


# ── Comments: delete_comment ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_comment_as_owner(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)

    await comment_service.delete_comment(db_session, comment.id, regular_user.id)
    await db_session.refresh(comment)
    assert comment.deleted_at is not None
    assert comment.body == "[deleted]"


@pytest.mark.asyncio
async def test_delete_comment_as_moderator(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)

    # second_user acts as moderator
    await comment_service.delete_comment(db_session, comment.id, second_user.id, is_mod=True)
    await db_session.refresh(comment)
    assert comment.deleted_at is not None


@pytest.mark.asyncio
async def test_delete_comment_wrong_user_not_mod(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    post = await _make_post(db_session, regular_user)
    comment = await _make_comment(db_session, regular_user, post)

    with pytest.raises(ForbiddenError):
        await comment_service.delete_comment(db_session, comment.id, second_user.id, is_mod=False)


# ── Reactions: add_reaction ───────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_add_reaction_success(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = ReactionCreate(content_type="post", content_id=post.id, emoji="👍")
    reaction = await reaction_service.add_reaction(db_session, regular_user.id, data)
    assert reaction.emoji == "👍"


@pytest.mark.asyncio
async def test_add_reaction_duplicate_raises(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = ReactionCreate(content_type="post", content_id=post.id, emoji="❤️")
    await reaction_service.add_reaction(db_session, regular_user.id, data)
    with pytest.raises(ConflictError):
        await reaction_service.add_reaction(db_session, regular_user.id, data)


# ── Reactions: remove_reaction ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_reaction_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await reaction_service.remove_reaction(db_session, regular_user.id, uuid.uuid4())


@pytest.mark.asyncio
async def test_remove_reaction_wrong_user(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    post = await _make_post(db_session, regular_user)
    reaction = Reaction(
        user_id=regular_user.id, content_type="post", content_id=post.id, emoji="🔥"
    )
    db_session.add(reaction)
    await db_session.flush()

    # second_user tries to remove regular_user's reaction
    with pytest.raises(NotFoundError):
        await reaction_service.remove_reaction(db_session, second_user.id, reaction.id)


# ── Reactions: get_reaction_summary ──────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_reaction_summary(db_session: AsyncSession, regular_user: User, second_user: User):
    post = await _make_post(db_session, regular_user)
    r1 = Reaction(user_id=regular_user.id, content_type="post", content_id=post.id, emoji="👍")
    r2 = Reaction(user_id=second_user.id, content_type="post", content_id=post.id, emoji="👍")
    r3 = Reaction(user_id=regular_user.id, content_type="post", content_id=post.id, emoji="❤️")
    db_session.add_all([r1, r2, r3])
    await db_session.flush()

    summary = await reaction_service.get_reaction_summary(db_session, "post", post.id)
    assert len(summary) == 2
    assert summary[0].emoji == "👍"
    assert summary[0].count == 2


# ── Bookmarks: add / duplicate / remove ──────────────────────────────────────


@pytest.mark.asyncio
async def test_add_bookmark(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = BookmarkCreate(content_type="post", content_id=post.id)
    bookmark = await reaction_service.add_bookmark(db_session, regular_user.id, data)
    assert bookmark.content_type == "post"


@pytest.mark.asyncio
async def test_add_bookmark_duplicate_raises(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = BookmarkCreate(content_type="post", content_id=post.id)
    await reaction_service.add_bookmark(db_session, regular_user.id, data)
    with pytest.raises(ConflictError):
        await reaction_service.add_bookmark(db_session, regular_user.id, data)


@pytest.mark.asyncio
async def test_remove_bookmark_success(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = BookmarkCreate(content_type="post", content_id=post.id)
    bookmark = await reaction_service.add_bookmark(db_session, regular_user.id, data)
    await reaction_service.remove_bookmark(db_session, regular_user.id, bookmark.id)


@pytest.mark.asyncio
async def test_remove_bookmark_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await reaction_service.remove_bookmark(db_session, regular_user.id, uuid.uuid4())


@pytest.mark.asyncio
async def test_list_bookmarks_with_filter(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    bm = Bookmark(user_id=regular_user.id, content_type="post", content_id=post.id)
    db_session.add(bm)
    await db_session.flush()

    bookmarks = await reaction_service.list_bookmarks(db_session, regular_user.id, content_type="post")
    assert len(bookmarks) >= 1
    assert all(b.content_type == "post" for b in bookmarks)


# ── remove_reaction ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_reaction_success(db_session: AsyncSession, regular_user: User):
    post = await _make_post(db_session, regular_user)
    data = ReactionCreate(content_type="post", content_id=post.id, emoji="👍")
    reaction = await reaction_service.add_reaction(db_session, regular_user.id, data)
    # Should not raise
    await reaction_service.remove_reaction(db_session, regular_user.id, reaction.id)


@pytest.mark.asyncio
async def test_remove_reaction_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await reaction_service.remove_reaction(db_session, regular_user.id, uuid.uuid4())


# ── users service: get_or_create_settings create branch ───────────────────────


@pytest.mark.asyncio
async def test_get_or_create_settings_creates_when_missing(db_session: AsyncSession):
    from modules.users.models import User as UserModel
    from modules.users import service as user_service
    from core.security import hash_password as hp

    user = UserModel(
        username="nosettings_user",
        email="nosettings@example.com",
        password_hash=hp("Pass123!"),
        role="member",
        status="active",
        email_verified=True,
    )
    db_session.add(user)
    await db_session.flush()
    # Do NOT create UserSettings - test the creation branch
    settings = await user_service.get_or_create_settings(db_session, user.id)
    assert settings.user_id == user.id
