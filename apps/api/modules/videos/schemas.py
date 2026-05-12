from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VideoQualityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    label: str
    width: int | None
    height: int | None
    bitrate: int | None
    s3_key: str
    created_at: datetime


class VideoJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    video_id: UUID
    status: str
    progress: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class VideoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None
    status: str
    visibility: str
    hls_manifest_url: str | None
    thumbnail_url: str | None
    preview_gif_url: str | None
    duration_seconds: float | None
    file_size_bytes: int | None
    allow_comment: bool
    allow_embed: bool
    view_count: int
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class VideoDetail(VideoOut):
    raw_s3_key: str | None
    qualities: list[VideoQualityOut] = []


class VideoInitUpload(BaseModel):
    title: str = Field(..., max_length=300)
    description: str | None = None
    filename: str
    content_type: str = "video/mp4"
    visibility: str = Field("private", pattern="^(public|unlisted|private)$")


class UploadInitResponse(BaseModel):
    video_id: UUID
    job_id: UUID
    upload_url: str
    upload_fields: dict = {}


class VideoUpdate(BaseModel):
    title: str | None = Field(None, max_length=300)
    description: str | None = None
    visibility: str | None = Field(None, pattern="^(public|unlisted|private)$")
    allow_comment: bool | None = None
    allow_embed: bool | None = None
