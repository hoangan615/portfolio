from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile, status

from core.storage import storage
from modules.users import schemas, service
from modules.users.models import User
from shared.dependencies import CurrentUser, DBDep, get_current_user
from shared.exceptions import BadRequestError
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserPrivate)
async def get_me(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=schemas.UserPrivate)
async def update_me(
    data: schemas.UserUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_profile(db, current_user, data)  # type: ignore[arg-type]


@router.post("/me/avatar", response_model=schemas.UserPrivate)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: DBDep = Depends(),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise BadRequestError("Only JPEG, PNG, and WebP images allowed")
    key = storage.build_key("avatars", file.filename or "avatar.jpg", current_user.id)
    url = storage.upload_fileobj(file.file, key, file.content_type)
    return await service.update_avatar(db, current_user, url)


@router.post("/me/cover", response_model=schemas.UserPrivate)
async def upload_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: DBDep = Depends(),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise BadRequestError("Only JPEG, PNG, and WebP images allowed")
    key = storage.build_key("covers", file.filename or "cover.jpg", current_user.id)
    url = storage.upload_fileobj(file.file, key, file.content_type)
    return await service.update_cover(db, current_user, url)


@router.post("/me/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: schemas.ChangePasswordRequest,
    current_user: CurrentUser,
    db: DBDep,
):
    await service.change_password(db, current_user, data)  # type: ignore[arg-type]


@router.get("/me/settings", response_model=schemas.UserSettingsSchema)
async def get_settings(current_user: CurrentUser, db: DBDep):
    return await service.get_or_create_settings(db, current_user.id)  # type: ignore[union-attr]


@router.patch("/me/settings", response_model=schemas.UserSettingsSchema)
async def update_settings(
    data: schemas.UserSettingsUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_settings(db, current_user.id, data)  # type: ignore[union-attr]


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(current_user: CurrentUser, db: DBDep):
    await service.delete_account(db, current_user)  # type: ignore[arg-type]


@router.get("/{username}", response_model=schemas.UserPublic)
async def get_profile(username: str, db: DBDep):
    return await service.get_user_by_username(db, username)


@router.post("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def follow(user_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.follow_user(db, current_user, user_id)  # type: ignore[arg-type]


@router.delete("/{user_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow(user_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.unfollow_user(db, current_user, user_id)  # type: ignore[arg-type]


@router.get("/{user_id}/follow-status", response_model=schemas.FollowStatus)
async def follow_status(user_id: UUID, current_user: CurrentUser, db: DBDep):
    target = await service.get_user_by_id(db, user_id)
    is_following = await service.is_following(db, current_user.id, user_id)  # type: ignore[union-attr]
    return schemas.FollowStatus(is_following=is_following, follower_count=target.follower_count)


@router.get("/{user_id}/followers", response_model=PagedResponse[schemas.UserPublic])
async def get_followers(user_id: UUID, db: DBDep, params: PageParams = Depends()):
    users, total = await service.get_followers(db, user_id, params.offset, params.limit)
    return PagedResponse.create(users, total, params)


@router.get("/{user_id}/following", response_model=PagedResponse[schemas.UserPublic])
async def get_following(user_id: UUID, db: DBDep, params: PageParams = Depends()):
    users, total = await service.get_following(db, user_id, params.offset, params.limit)
    return PagedResponse.create(users, total, params)
