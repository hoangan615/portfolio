from __future__ import annotations

from uuid import UUID

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import hash_password, verify_password
from modules.users.models import Follow, User, UserSettings, UserStorageUsage
from modules.users.schemas import ChangePasswordRequest, UserSettingsUpdate, UserUpdate
from shared.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")
    return user


async def get_user_by_username(db: AsyncSession, username: str) -> User:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")
    return user


async def update_profile(db: AsyncSession, user: User, data: UserUpdate) -> User:
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(user, field, value)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update_avatar(db: AsyncSession, user: User, url: str) -> User:
    user.avatar_url = url
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def update_cover(db: AsyncSession, user: User, url: str) -> User:
    user.cover_url = url
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def change_password(db: AsyncSession, user: User, data: ChangePasswordRequest) -> None:
    if not user.password_hash:
        raise BadRequestError("Account uses OAuth — no password set")
    if not verify_password(data.current_password, user.password_hash):
        raise BadRequestError("Current password is incorrect")
    user.password_hash = hash_password(data.new_password)
    db.add(user)
    await db.flush()


async def follow_user(db: AsyncSession, follower: User, target_id: UUID) -> None:
    if follower.id == target_id:
        raise BadRequestError("Cannot follow yourself")
    target = await get_user_by_id(db, target_id)
    # Check not already following
    existing = await db.execute(
        select(Follow).where(
            Follow.follower_id == follower.id, Follow.following_id == target_id
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError("Already following this user")
    follow = Follow(follower_id=follower.id, following_id=target_id)
    db.add(follow)
    # Update counts
    follower.following_count = (follower.following_count or 0) + 1
    target.follower_count = (target.follower_count or 0) + 1
    db.add(follower)
    db.add(target)
    await db.flush()


async def unfollow_user(db: AsyncSession, follower: User, target_id: UUID) -> None:
    target = await get_user_by_id(db, target_id)
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == follower.id, Follow.following_id == target_id
        )
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise NotFoundError("Follow relationship")
    await db.delete(follow)
    follower.following_count = max(0, (follower.following_count or 1) - 1)
    target.follower_count = max(0, (target.follower_count or 1) - 1)
    db.add(follower)
    db.add(target)
    await db.flush()


async def is_following(db: AsyncSession, follower_id: UUID, target_id: UUID) -> bool:
    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == follower_id, Follow.following_id == target_id
        )
    )
    return result.scalar_one_or_none() is not None


async def get_followers(db: AsyncSession, user_id: UUID, offset: int, limit: int) -> tuple[list[User], int]:
    count_q = select(func.count(Follow.id)).where(Follow.following_id == user_id)
    count_result = await db.execute(count_q)
    total = count_result.scalar_one()

    q = (
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.following_id == user_id)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(q)
    return result.scalars().all(), total  # type: ignore[return-value]


async def get_following(db: AsyncSession, user_id: UUID, offset: int, limit: int) -> tuple[list[User], int]:
    count_q = select(func.count(Follow.id)).where(Follow.follower_id == user_id)
    count_result = await db.execute(count_q)
    total = count_result.scalar_one()

    q = (
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(Follow.follower_id == user_id)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(q)
    return result.scalars().all(), total  # type: ignore[return-value]


async def get_or_create_settings(db: AsyncSession, user_id: UUID) -> UserSettings:
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.flush()
        await db.refresh(settings)
    return settings


async def update_settings(db: AsyncSession, user_id: UUID, data: UserSettingsUpdate) -> UserSettings:
    settings_obj = await get_or_create_settings(db, user_id)
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(settings_obj, field, value)
    db.add(settings_obj)
    await db.flush()
    await db.refresh(settings_obj)
    return settings_obj


async def delete_account(db: AsyncSession, user: User) -> None:
    user.status = "deleted"
    user.email = f"deleted_{user.id}@deleted.local"
    user.username = f"deleted_{user.id}"
    user.password_hash = None
    user.avatar_url = None
    user.bio = None
    db.add(user)
    await db.flush()
