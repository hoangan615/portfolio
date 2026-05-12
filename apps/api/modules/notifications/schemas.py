from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: str
    actor_id: UUID | None
    content_type: str | None
    content_id: UUID | None
    payload_json: dict[str, Any] | None
    read: bool
    created_at: datetime


class UnreadCountResponse(BaseModel):
    unread_count: int
