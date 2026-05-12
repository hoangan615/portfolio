from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    content_type: str
    content_id: UUID
    user_id: UUID
    emoji: str
    created_at: datetime


class ReactionCreate(BaseModel):
    content_type: str = Field(..., pattern="^(post|video|comment)$")
    content_id: UUID
    emoji: str = Field(..., max_length=10)


class ReactionSummary(BaseModel):
    emoji: str
    count: int


class BookmarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    content_type: str
    content_id: UUID
    created_at: datetime


class BookmarkCreate(BaseModel):
    content_type: str = Field(..., pattern="^(post|video)$")
    content_id: UUID
