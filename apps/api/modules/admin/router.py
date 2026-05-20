from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select, update

from modules.posts.models import Post
from modules.users.models import User
from shared.dependencies import DBDep, require_min_role
from shared.exceptions import NotFoundError
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/admin", tags=["admin"])

AdminRequired = require_min_role("admin")
ModeratorRequired = require_min_role("moderator")


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    username: str
    display_name: str | None
    avatar_url: str | None
    role: str
    status: str
    is_banned: bool
    created_at: datetime

    @classmethod
    def from_user(cls, user: User) -> "AdminUserOut":
        return cls(
            id=user.id,
            username=user.username,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            role=user.role,
            status=user.status,
            is_banned=user.status == "banned",
            created_at=user.created_at,
        )


class AdminPendingPost(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    type: str = "post"
    title: str | None
    author_id: UUID
    author_username: str
    author_display_name: str | None
    author_avatar_url: str | None
    status: str
    created_at: datetime


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=PagedResponse[AdminUserOut], dependencies=[ModeratorRequired])
async def list_users(
    db: DBDep,
    params: PageParams = Depends(),
    search: str | None = Query(None),
    role: str | None = Query(None),
    banned: bool | None = Query(None),
):
    q = select(User)
    if search:
        q = q.where(
            User.username.ilike(f"%{search}%") | User.display_name.ilike(f"%{search}%")
        )
    if role:
        q = q.where(User.role == role)
    if banned is True:
        q = q.where(User.status == "banned")
    elif banned is False:
        q = q.where(User.status != "banned")

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()

    rows = (await db.execute(q.offset(params.offset).limit(params.limit).order_by(User.created_at.desc()))).scalars().all()
    return PagedResponse.create([AdminUserOut.from_user(u) for u in rows], total, params)


@router.post("/users/{user_id}/ban", status_code=204, dependencies=[ModeratorRequired])
async def ban_user(user_id: UUID, db: DBDep):
    result = await db.execute(
        update(User).where(User.id == user_id).values(status="banned").returning(User.id)
    )
    if not result.fetchone():
        raise NotFoundError("User not found")
    await db.commit()


@router.post("/users/{user_id}/unban", status_code=204, dependencies=[ModeratorRequired])
async def unban_user(user_id: UUID, db: DBDep):
    result = await db.execute(
        update(User).where(User.id == user_id).values(status="active").returning(User.id)
    )
    if not result.fetchone():
        raise NotFoundError("User not found")
    await db.commit()


@router.put("/users/{user_id}/role", response_model=AdminUserOut, dependencies=[AdminRequired])
async def update_user_role(user_id: UUID, body: dict, db: DBDep):
    role = body.get("role")
    result = await db.execute(
        update(User).where(User.id == user_id).values(role=role).returning(User.id)
    )
    if not result.fetchone():
        raise NotFoundError("User not found")
    await db.commit()
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one()
    return AdminUserOut.from_user(user)


# ── Content ───────────────────────────────────────────────────────────────────

@router.get("/content/pending", response_model=list[AdminPendingPost], dependencies=[ModeratorRequired])
async def get_pending_content(db: DBDep):
    q = (
        select(Post, User)
        .join(User, Post.user_id == User.id)
        .where(Post.status == "pending_review")
        .order_by(Post.created_at.asc())
        .limit(50)
    )
    rows = (await db.execute(q)).all()
    return [
        AdminPendingPost(
            id=post.id,
            type="post",
            title=post.title,
            author_id=user.id,
            author_username=user.username,
            author_display_name=user.display_name,
            author_avatar_url=user.avatar_url,
            status=post.status,
            created_at=post.created_at,
        )
        for post, user in rows
    ]


@router.post("/content/post/{post_id}/approve", status_code=204, dependencies=[ModeratorRequired])
async def approve_post(post_id: UUID, db: DBDep):
    result = await db.execute(
        update(Post)
        .where(Post.id == post_id)
        .values(status="published", published_at=datetime.now(timezone.utc))
        .returning(Post.id)
    )
    if not result.fetchone():
        raise NotFoundError("Post not found")
    await db.commit()


@router.post("/content/post/{post_id}/reject", status_code=204, dependencies=[ModeratorRequired])
async def reject_post(post_id: UUID, db: DBDep):
    result = await db.execute(
        update(Post).where(Post.id == post_id).values(status="rejected").returning(Post.id)
    )
    if not result.fetchone():
        raise NotFoundError("Post not found")
    await db.commit()
