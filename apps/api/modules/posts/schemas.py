from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    description: str | None
    created_at: datetime


class TagOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    slug: str
    description: str | None
    created_at: datetime


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    title: str | None
    slug: str
    excerpt: str | None
    cover_image_url: str | None
    status: str
    view_count: int
    published_at: datetime | None
    scheduled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PostDetail(PostOut):
    content: str | None
    review_note: str | None


class PostCreate(BaseModel):
    type: str = Field("article", pattern="^(article|short|gallery|til)$")
    title: str | None = Field(None, max_length=300)
    slug: str | None = Field(None, max_length=350)
    content: str | None = None
    excerpt: str | None = Field(None, max_length=500)
    cover_image_url: str | None = None
    scheduled_at: datetime | None = None
    category_ids: list[UUID] = []
    tag_ids: list[UUID] = []


class PostUpdate(BaseModel):
    type: str | None = Field(None, pattern="^(article|short|gallery|til)$")
    title: str | None = Field(None, max_length=300)
    slug: str | None = Field(None, max_length=350)
    content: str | None = None
    excerpt: str | None = Field(None, max_length=500)
    cover_image_url: str | None = None
    status: str | None = Field(None, pattern="^(draft|pending_review|published|rejected|archived)$")
    review_note: str | None = None
    scheduled_at: datetime | None = None
    category_ids: list[UUID] | None = None
    tag_ids: list[UUID] | None = None


class SeriesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    title: str
    slug: str
    description: str | None
    cover_image_url: str | None
    created_at: datetime
