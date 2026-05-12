from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from modules.portfolio.models import ContactMessage, Experience, PortfolioProfile, Project, Skill
from modules.portfolio.schemas import (
    ContactCreate,
    ExperienceCreate,
    ExperienceUpdate,
    PortfolioProfileUpdate,
    ProjectCreate,
    ProjectUpdate,
    SkillCreate,
    SkillUpdate,
)
from shared.exceptions import NotFoundError


# ── Portfolio profile ─────────────────────────────────────────────────────────

async def get_portfolio(db: AsyncSession, user_id: UUID) -> dict:
    profile_result = await db.execute(
        select(PortfolioProfile)
        .where(PortfolioProfile.user_id == user_id)
        .options(
            selectinload(PortfolioProfile.skills),
            selectinload(PortfolioProfile.experiences),
            selectinload(PortfolioProfile.projects),
        )
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        return {"profile": None, "skills": [], "experiences": [], "projects": []}

    return {
        "profile": profile,
        "skills": sorted(profile.skills, key=lambda s: s.sort_order),
        "experiences": sorted(profile.experiences, key=lambda e: e.sort_order),
        "projects": sorted(profile.projects, key=lambda p: p.sort_order),
    }


async def get_or_create_profile(db: AsyncSession, user_id: UUID) -> PortfolioProfile:
    result = await db.execute(
        select(PortfolioProfile).where(PortfolioProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        profile = PortfolioProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
        await db.refresh(profile)
    return profile


async def update_portfolio(
    db: AsyncSession, user_id: UUID, data: PortfolioProfileUpdate
) -> PortfolioProfile:
    profile = await get_or_create_profile(db, user_id)
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(profile, field, value)
    db.add(profile)
    await db.flush()
    await db.refresh(profile)
    return profile


# ── Skills ────────────────────────────────────────────────────────────────────

async def create_skill(db: AsyncSession, user_id: UUID, data: SkillCreate) -> Skill:
    await get_or_create_profile(db, user_id)
    skill = Skill(user_id=user_id, **data.model_dump())
    db.add(skill)
    await db.flush()
    await db.refresh(skill)
    return skill


async def get_skill(db: AsyncSession, skill_id: UUID, user_id: UUID) -> Skill:
    result = await db.execute(
        select(Skill).where(Skill.id == skill_id, Skill.user_id == user_id)
    )
    skill = result.scalar_one_or_none()
    if not skill:
        raise NotFoundError("Skill")
    return skill


async def update_skill(
    db: AsyncSession, skill_id: UUID, user_id: UUID, data: SkillUpdate
) -> Skill:
    skill = await get_skill(db, skill_id, user_id)
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(skill, field, value)
    db.add(skill)
    await db.flush()
    await db.refresh(skill)
    return skill


async def delete_skill(db: AsyncSession, skill_id: UUID, user_id: UUID) -> None:
    skill = await get_skill(db, skill_id, user_id)
    await db.delete(skill)
    await db.flush()


# ── Experiences ───────────────────────────────────────────────────────────────

async def create_experience(
    db: AsyncSession, user_id: UUID, data: ExperienceCreate
) -> Experience:
    await get_or_create_profile(db, user_id)
    exp = Experience(user_id=user_id, **data.model_dump())
    db.add(exp)
    await db.flush()
    await db.refresh(exp)
    return exp


async def get_experience(db: AsyncSession, exp_id: UUID, user_id: UUID) -> Experience:
    result = await db.execute(
        select(Experience).where(Experience.id == exp_id, Experience.user_id == user_id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise NotFoundError("Experience")
    return exp


async def update_experience(
    db: AsyncSession, exp_id: UUID, user_id: UUID, data: ExperienceUpdate
) -> Experience:
    exp = await get_experience(db, exp_id, user_id)
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(exp, field, value)
    db.add(exp)
    await db.flush()
    await db.refresh(exp)
    return exp


async def delete_experience(db: AsyncSession, exp_id: UUID, user_id: UUID) -> None:
    exp = await get_experience(db, exp_id, user_id)
    await db.delete(exp)
    await db.flush()


# ── Projects ──────────────────────────────────────────────────────────────────

async def create_project(
    db: AsyncSession, user_id: UUID, data: ProjectCreate
) -> Project:
    await get_or_create_profile(db, user_id)
    proj = Project(user_id=user_id, **data.model_dump())
    db.add(proj)
    await db.flush()
    await db.refresh(proj)
    return proj


async def get_project(db: AsyncSession, proj_id: UUID, user_id: UUID) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == proj_id, Project.user_id == user_id)
    )
    proj = result.scalar_one_or_none()
    if not proj:
        raise NotFoundError("Project")
    return proj


async def update_project(
    db: AsyncSession, proj_id: UUID, user_id: UUID, data: ProjectUpdate
) -> Project:
    proj = await get_project(db, proj_id, user_id)
    changes = data.model_dump(exclude_none=True)
    for field, value in changes.items():
        setattr(proj, field, value)
    db.add(proj)
    await db.flush()
    await db.refresh(proj)
    return proj


async def delete_project(db: AsyncSession, proj_id: UUID, user_id: UUID) -> None:
    proj = await get_project(db, proj_id, user_id)
    await db.delete(proj)
    await db.flush()


# ── Contact ───────────────────────────────────────────────────────────────────

async def create_contact_message(
    db: AsyncSession, data: ContactCreate
) -> ContactMessage:
    msg = ContactMessage(**data.model_dump())
    db.add(msg)
    await db.flush()
    await db.refresh(msg)
    return msg
