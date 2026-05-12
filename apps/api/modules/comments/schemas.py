from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    content_type: str
    content_id: UUID
    user_id: UUID
    parent_id: UUID | None
    body: str
    edited_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime


class CommentCreate(BaseModel):
    content_type: str = Field(..., pattern="^(post|video)$")
    content_id: UUID
    parent_id: UUID | None = None
    body: str = Field(..., min_length=1, max_length=5000)


class CommentUpdate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
