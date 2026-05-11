from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    filename: str
    original_url: str
    webp_url: str | None
    thumbnail_url: str | None
    mime_type: str
    file_size_bytes: int | None
    width: int | None
    height: int | None
    created_at: datetime
