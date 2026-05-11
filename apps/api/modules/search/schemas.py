from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SearchResultPost(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str
    title: str | None
    slug: str
    excerpt: str | None
    cover_image_url: str | None
    user_id: UUID
    view_count: int
    published_at: datetime | None
    created_at: datetime


class SearchResultUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    display_name: str | None
    avatar_url: str | None
    bio: str | None
    follower_count: int
    created_at: datetime


class SearchResponse(BaseModel):
    posts: list[SearchResultPost]
    users: list[SearchResultUser]
    total_posts: int
    total_users: int
    query: str
    page: int
    page_size: int
