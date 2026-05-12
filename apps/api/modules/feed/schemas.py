from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class FeedItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    item_type: str  # "post" or "video"
    user_id: UUID
    title: str | None
    slug: str | None
    excerpt: str | None
    cover_image_url: str | None
    thumbnail_url: str | None
    view_count: int
    published_at: datetime | None
    created_at: datetime
