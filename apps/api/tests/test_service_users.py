"""Unit tests for modules/users/service.py — direct service calls."""
from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password
from modules.users.models import Follow, User, UserSettings
from modules.users.schemas import ChangePasswordRequest, UserSettingsUpdate, UserUpdate
from modules.users import service
from shared.exceptions import BadRequestError, ConflictError, NotFoundError


# ── get_user_by_id ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_by_id_found(db_session: AsyncSession, regular_user: User):
    found = await service.get_user_by_id(db_session, regular_user.id)
    assert found.id == regular_user.id


@pytest.mark.asyncio
async def test_get_user_by_id_not_found(db_session: AsyncSession):
    import uuid
    with pytest.raises(NotFoundError):
        await service.get_user_by_id(db_session, uuid.uuid4())


# ── get_user_by_username ──────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_user_by_username_found(db_session: AsyncSession, regular_user: User):
    found = await service.get_user_by_username(db_session, regular_user.username)
    assert found.username == regular_user.username


@pytest.mark.asyncio
async def test_get_user_by_username_not_found(db_session: AsyncSession):
    with pytest.raises(NotFoundError):
        await service.get_user_by_username(db_session, "no_such_user_xyz")


# ── update_profile ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_profile(db_session: AsyncSession, regular_user: User):
    data = UserUpdate(display_name="New Name", bio="New bio")
    updated = await service.update_profile(db_session, regular_user, data)
    assert updated.display_name == "New Name"
    assert updated.bio == "New bio"


@pytest.mark.asyncio
async def test_update_profile_partial(db_session: AsyncSession, regular_user: User):
    original_bio = regular_user.bio
    data = UserUpdate(display_name="Only Name")
    updated = await service.update_profile(db_session, regular_user, data)
    assert updated.display_name == "Only Name"
    # bio should be unchanged since exclude_none=True
    assert updated.bio == original_bio


# ── update_avatar / update_cover ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_avatar(db_session: AsyncSession, regular_user: User):
    updated = await service.update_avatar(db_session, regular_user, "https://cdn.example.com/avatar.jpg")
    assert updated.avatar_url == "https://cdn.example.com/avatar.jpg"


@pytest.mark.asyncio
async def test_update_cover(db_session: AsyncSession, regular_user: User):
    updated = await service.update_cover(db_session, regular_user, "https://cdn.example.com/cover.jpg")
    assert updated.cover_url == "https://cdn.example.com/cover.jpg"


# ── change_password ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_change_password_success(db_session: AsyncSession, regular_user: User):
    data = ChangePasswordRequest(current_password="Password123!", new_password="NewPass456!")
    await service.change_password(db_session, regular_user, data)
    # Verify new password hash works
    from core.security import verify_password
    assert verify_password("NewPass456!", regular_user.password_hash)


@pytest.mark.asyncio
async def test_change_password_wrong_current(db_session: AsyncSession, regular_user: User):
    data = ChangePasswordRequest(current_password="WrongPassword!", new_password="NewPass456!")
    with pytest.raises(BadRequestError):
        await service.change_password(db_session, regular_user, data)


@pytest.mark.asyncio
async def test_change_password_oauth_user(db_session: AsyncSession):
    oauth_user = User(
        username="oauthuser",
        email="oauth@example.com",
        password_hash=None,
        role="member",
        status="active",
        email_verified=True,
    )
    db_session.add(oauth_user)
    await db_session.flush()

    data = ChangePasswordRequest(current_password="anything", new_password="NewPass456!")
    with pytest.raises(BadRequestError, match="OAuth"):
        await service.change_password(db_session, oauth_user, data)


# ── follow / unfollow ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_follow_user_success(db_session: AsyncSession, regular_user: User, second_user: User):
    await service.follow_user(db_session, regular_user, second_user.id)
    is_following = await service.is_following(db_session, regular_user.id, second_user.id)
    assert is_following is True


@pytest.mark.asyncio
async def test_follow_self_raises(db_session: AsyncSession, regular_user: User):
    with pytest.raises(BadRequestError, match="yourself"):
        await service.follow_user(db_session, regular_user, regular_user.id)


@pytest.mark.asyncio
async def test_follow_already_following_raises(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    await service.follow_user(db_session, regular_user, second_user.id)
    with pytest.raises(ConflictError):
        await service.follow_user(db_session, regular_user, second_user.id)


@pytest.mark.asyncio
async def test_unfollow_user_success(db_session: AsyncSession, regular_user: User, second_user: User):
    follow = Follow(follower_id=regular_user.id, following_id=second_user.id)
    db_session.add(follow)
    await db_session.flush()

    await service.unfollow_user(db_session, regular_user, second_user.id)
    is_following = await service.is_following(db_session, regular_user.id, second_user.id)
    assert is_following is False


@pytest.mark.asyncio
async def test_unfollow_not_following_raises(
    db_session: AsyncSession, regular_user: User, second_user: User
):
    with pytest.raises(NotFoundError):
        await service.unfollow_user(db_session, regular_user, second_user.id)


# ── get_followers / get_following ─────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_followers(db_session: AsyncSession, regular_user: User, second_user: User):
    follow = Follow(follower_id=second_user.id, following_id=regular_user.id)
    db_session.add(follow)
    await db_session.flush()

    followers, total = await service.get_followers(db_session, regular_user.id, 0, 20)
    assert total == 1
    assert any(u.id == second_user.id for u in followers)


@pytest.mark.asyncio
async def test_get_following(db_session: AsyncSession, regular_user: User, second_user: User):
    follow = Follow(follower_id=regular_user.id, following_id=second_user.id)
    db_session.add(follow)
    await db_session.flush()

    following, total = await service.get_following(db_session, regular_user.id, 0, 20)
    assert total == 1
    assert any(u.id == second_user.id for u in following)


# ── settings ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_or_create_settings_creates(db_session: AsyncSession, regular_user: User):
    settings = await service.get_or_create_settings(db_session, regular_user.id)
    assert settings.user_id == regular_user.id


@pytest.mark.asyncio
async def test_get_or_create_settings_idempotent(db_session: AsyncSession, regular_user: User):
    s1 = await service.get_or_create_settings(db_session, regular_user.id)
    s2 = await service.get_or_create_settings(db_session, regular_user.id)
    assert s1.user_id == s2.user_id


@pytest.mark.asyncio
async def test_update_settings(db_session: AsyncSession, regular_user: User):
    data = UserSettingsUpdate(email_on_follow=False, theme="dark")
    settings = await service.update_settings(db_session, regular_user.id, data)
    assert settings.email_on_follow is False
    assert settings.theme == "dark"


# ── delete_account ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_delete_account(db_session: AsyncSession, regular_user: User):
    await service.delete_account(db_session, regular_user)
    assert regular_user.status == "deleted"
    assert "deleted_" in regular_user.username
    assert regular_user.password_hash is None
    assert regular_user.bio is None
