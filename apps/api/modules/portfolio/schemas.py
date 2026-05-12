from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Portfolio Profile ─────────────────────────────────────────────────────────

class PortfolioProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    headline: str | None
    tagline: str | None
    about: str | None
    resume_url: str | None
    github_url: str | None
    linkedin_url: str | None
    twitter_url: str | None
    open_to_work: bool
    updated_at: datetime


class PortfolioProfileUpdate(BaseModel):
    headline: str | None = Field(None, max_length=200)
    tagline: str | None = Field(None, max_length=300)
    about: str | None = None
    resume_url: str | None = Field(None, max_length=500)
    github_url: str | None = Field(None, max_length=500)
    linkedin_url: str | None = Field(None, max_length=500)
    twitter_url: str | None = Field(None, max_length=500)
    open_to_work: bool | None = None


# ── Skill ─────────────────────────────────────────────────────────────────────

class SkillOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    category: str | None
    proficiency: int | None
    icon_url: str | None
    sort_order: int
    created_at: datetime


class SkillCreate(BaseModel):
    name: str = Field(..., max_length=100)
    category: str | None = Field(None, max_length=100)
    proficiency: int | None = Field(None, ge=1, le=100)
    icon_url: str | None = None
    sort_order: int = 0


class SkillUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    category: str | None = Field(None, max_length=100)
    proficiency: int | None = Field(None, ge=1, le=100)
    icon_url: str | None = None
    sort_order: int | None = None


# ── Experience ────────────────────────────────────────────────────────────────

class ExperienceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    company: str
    title: str
    location: str | None
    start_date: str
    end_date: str | None
    description: str | None
    technologies: str | None
    sort_order: int
    created_at: datetime


class ExperienceCreate(BaseModel):
    company: str = Field(..., max_length=200)
    title: str = Field(..., max_length=200)
    location: str | None = Field(None, max_length=200)
    start_date: str = Field(..., max_length=20)
    end_date: str | None = Field(None, max_length=20)
    description: str | None = None
    technologies: str | None = None
    sort_order: int = 0


class ExperienceUpdate(BaseModel):
    company: str | None = Field(None, max_length=200)
    title: str | None = Field(None, max_length=200)
    location: str | None = Field(None, max_length=200)
    start_date: str | None = Field(None, max_length=20)
    end_date: str | None = Field(None, max_length=20)
    description: str | None = None
    technologies: str | None = None
    sort_order: int | None = None


# ── Project ───────────────────────────────────────────────────────────────────

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None
    tech_stack: str | None
    cover_image_url: str | None
    demo_url: str | None
    repo_url: str | None
    featured: bool
    sort_order: int
    created_at: datetime


class ProjectCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = None
    tech_stack: str | None = None
    cover_image_url: str | None = None
    demo_url: str | None = Field(None, max_length=500)
    repo_url: str | None = Field(None, max_length=500)
    featured: bool = False
    sort_order: int = 0


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = None
    tech_stack: str | None = None
    cover_image_url: str | None = None
    demo_url: str | None = Field(None, max_length=500)
    repo_url: str | None = Field(None, max_length=500)
    featured: bool | None = None
    sort_order: int | None = None


# ── Full portfolio response ───────────────────────────────────────────────────

class PortfolioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    profile: PortfolioProfileOut | None
    skills: list[SkillOut]
    experiences: list[ExperienceOut]
    projects: list[ProjectOut]


# ── Contact ───────────────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str = Field(..., max_length=200)
    email: EmailStr
    subject: str | None = Field(None, max_length=300)
    body: str = Field(..., min_length=10)


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    subject: str | None
    body: str
    read: bool
    created_at: datetime
