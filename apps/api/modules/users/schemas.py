from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    display_name: str | None
    avatar_url: str | None
    cover_url: str | None
    bio: str | None
    website_url: str | None
    location: str | None
    role: str
    follower_count: int
    following_count: int
    post_count: int
    created_at: datetime


class UserPrivate(UserPublic):
    email: str
    email_verified: bool
    status: str
    updated_at: datetime


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=500)
    website_url: str | None = Field(None, max_length=500)
    location: str | None = Field(None, max_length=100)

    @field_validator("website_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class UserSettingsSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email_on_follow: bool
    email_on_comment: bool
    email_on_reaction: bool
    email_newsletter: bool
    profile_public: bool
    show_email: bool
    theme: str


class UserSettingsUpdate(BaseModel):
    email_on_follow: bool | None = None
    email_on_comment: bool | None = None
    email_on_reaction: bool | None = None
    email_newsletter: bool | None = None
    profile_public: bool | None = None
    show_email: bool | None = None
    theme: str | None = Field(None, pattern="^(light|dark|system)$")


class FollowStatus(BaseModel):
    is_following: bool
    follower_count: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    password: str
