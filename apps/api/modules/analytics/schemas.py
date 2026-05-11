from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ContentViewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    content_type: str
    content_id: UUID
    viewer_id: UUID | None
    ip_hash: str | None
    created_at: datetime


class DailyViewStat(BaseModel):
    date: date
    content_type: str
    view_count: int


class TopContent(BaseModel):
    content_type: str
    content_id: UUID
    view_count: int


class AnalyticsSummary(BaseModel):
    total_views: int
    total_posts: int
    total_videos: int
    total_users: int
    top_posts: list[TopContent]
    top_videos: list[TopContent]
    daily_views: list[DailyViewStat]
