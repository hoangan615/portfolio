from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reporter_id: UUID
    content_type: str
    content_id: UUID
    reason: str
    description: str | None
    status: str
    reviewed_by: UUID | None
    reviewed_at: datetime | None
    created_at: datetime


class ReportCreate(BaseModel):
    content_type: str = Field(..., pattern="^(post|video|comment|user)$")
    content_id: UUID
    reason: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=1000)


class ReviewReport(BaseModel):
    status: str = Field(..., pattern="^(reviewed|dismissed|actioned)$")


class ModerationActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    moderator_id: UUID
    target_user_id: UUID | None
    action_type: str
    reason: str | None
    content_type: str | None
    content_id: UUID | None
    report_id: UUID | None
    created_at: datetime


class ModerationActionCreate(BaseModel):
    target_user_id: UUID | None = None
    action_type: str = Field(
        ..., pattern="^(warn|mute|restrict|suspend|ban|delete_content|restore_content)$"
    )
    reason: str | None = None
    content_type: str | None = None
    content_id: UUID | None = None
    report_id: UUID | None = None


class UserWarningOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    issued_by: UUID
    reason: str
    acknowledged: bool
    created_at: datetime
