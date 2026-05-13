"""Unit tests for modules/portfolio/service.py — direct service calls."""
from __future__ import annotations

import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.portfolio.models import PortfolioProfile, Skill
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
from modules.portfolio import service
from modules.users.models import User
from shared.exceptions import NotFoundError


# ── get_portfolio ─────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_portfolio_no_profile(db_session: AsyncSession, regular_user: User):
    result = await service.get_portfolio(db_session, regular_user.id)
    assert result["profile"] is None
    assert result["skills"] == []
    assert result["experiences"] == []
    assert result["projects"] == []


@pytest.mark.asyncio
async def test_get_portfolio_with_profile(db_session: AsyncSession, regular_user: User):
    profile = PortfolioProfile(user_id=regular_user.id, headline="Dev")
    db_session.add(profile)
    await db_session.flush()

    result = await service.get_portfolio(db_session, regular_user.id)
    assert result["profile"] is not None
    assert result["profile"].headline == "Dev"


# ── get_or_create_profile ─────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_or_create_profile_creates(db_session: AsyncSession, regular_user: User):
    profile = await service.get_or_create_profile(db_session, regular_user.id)
    assert profile.user_id == regular_user.id


@pytest.mark.asyncio
async def test_get_or_create_profile_idempotent(db_session: AsyncSession, regular_user: User):
    p1 = await service.get_or_create_profile(db_session, regular_user.id)
    p2 = await service.get_or_create_profile(db_session, regular_user.id)
    assert p1.user_id == p2.user_id


# ── update_portfolio ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_portfolio(db_session: AsyncSession, regular_user: User):
    data = PortfolioProfileUpdate(headline="Senior Dev", open_to_work=True)
    profile = await service.update_portfolio(db_session, regular_user.id, data)
    assert profile.headline == "Senior Dev"
    assert profile.open_to_work is True


@pytest.mark.asyncio
async def test_update_portfolio_creates_if_missing(db_session: AsyncSession, regular_user: User):
    data = PortfolioProfileUpdate(tagline="I build things")
    profile = await service.update_portfolio(db_session, regular_user.id, data)
    assert profile.user_id == regular_user.id
    assert profile.tagline == "I build things"


# ── Skills ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_skill(db_session: AsyncSession, regular_user: User):
    data = SkillCreate(name="Python", category="Backend", proficiency=95, sort_order=0)
    skill = await service.create_skill(db_session, regular_user.id, data)
    assert skill.name == "Python"
    assert skill.proficiency == 95


@pytest.mark.asyncio
async def test_get_skill_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.get_skill(db_session, uuid.uuid4(), regular_user.id)


@pytest.mark.asyncio
async def test_update_skill(db_session: AsyncSession, regular_user: User):
    skill = Skill(user_id=regular_user.id, name="JS", sort_order=0)
    db_session.add(skill)
    await db_session.flush()

    data = SkillUpdate(name="TypeScript", proficiency=80)
    updated = await service.update_skill(db_session, skill.id, regular_user.id, data)
    assert updated.name == "TypeScript"
    assert updated.proficiency == 80


@pytest.mark.asyncio
async def test_delete_skill(db_session: AsyncSession, regular_user: User):
    skill = Skill(user_id=regular_user.id, name="ToDelete", sort_order=0)
    db_session.add(skill)
    await db_session.flush()

    await service.delete_skill(db_session, skill.id, regular_user.id)

    with pytest.raises(NotFoundError):
        await service.get_skill(db_session, skill.id, regular_user.id)


@pytest.mark.asyncio
async def test_delete_skill_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.delete_skill(db_session, uuid.uuid4(), regular_user.id)


# ── Experiences ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_experience(db_session: AsyncSession, regular_user: User):
    data = ExperienceCreate(
        company="Acme Corp",
        title="Engineer",
        start_date="2022-01",
        sort_order=0,
    )
    exp = await service.create_experience(db_session, regular_user.id, data)
    assert exp.company == "Acme Corp"
    assert exp.title == "Engineer"


@pytest.mark.asyncio
async def test_get_experience_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.get_experience(db_session, uuid.uuid4(), regular_user.id)


@pytest.mark.asyncio
async def test_update_experience(db_session: AsyncSession, regular_user: User):
    create_data = ExperienceCreate(company="Old Co", title="Dev", start_date="2021-01", sort_order=0)
    exp = await service.create_experience(db_session, regular_user.id, create_data)

    update_data = ExperienceUpdate(title="Senior Dev", end_date="2023-12")
    updated = await service.update_experience(db_session, exp.id, regular_user.id, update_data)
    assert updated.title == "Senior Dev"
    assert updated.end_date == "2023-12"


@pytest.mark.asyncio
async def test_delete_experience(db_session: AsyncSession, regular_user: User):
    data = ExperienceCreate(company="Gone Co", title="Dev", start_date="2020-01", sort_order=0)
    exp = await service.create_experience(db_session, regular_user.id, data)

    await service.delete_experience(db_session, exp.id, regular_user.id)
    with pytest.raises(NotFoundError):
        await service.get_experience(db_session, exp.id, regular_user.id)


# ── Projects ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_project(db_session: AsyncSession, regular_user: User):
    data = ProjectCreate(title="My App", description="A cool app", sort_order=0)
    proj = await service.create_project(db_session, regular_user.id, data)
    assert proj.title == "My App"


@pytest.mark.asyncio
async def test_get_project_not_found(db_session: AsyncSession, regular_user: User):
    with pytest.raises(NotFoundError):
        await service.get_project(db_session, uuid.uuid4(), regular_user.id)


@pytest.mark.asyncio
async def test_update_project(db_session: AsyncSession, regular_user: User):
    create_data = ProjectCreate(title="Old Project", sort_order=0)
    proj = await service.create_project(db_session, regular_user.id, create_data)

    update_data = ProjectUpdate(title="New Project", tech_stack="Python, React")
    updated = await service.update_project(db_session, proj.id, regular_user.id, update_data)
    assert updated.title == "New Project"
    assert updated.tech_stack == "Python, React"


@pytest.mark.asyncio
async def test_delete_project(db_session: AsyncSession, regular_user: User):
    data = ProjectCreate(title="To Delete", sort_order=0)
    proj = await service.create_project(db_session, regular_user.id, data)

    await service.delete_project(db_session, proj.id, regular_user.id)
    with pytest.raises(NotFoundError):
        await service.get_project(db_session, proj.id, regular_user.id)


# ── Contact ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_contact_message(db_session: AsyncSession):
    data = ContactCreate(
        name="Visitor",
        email="visitor@example.com",
        body="Hello, I would like to connect with you here.",
    )
    msg = await service.create_contact_message(db_session, data)
    assert msg.name == "Visitor"
    assert msg.email == "visitor@example.com"


@pytest.mark.asyncio
async def test_create_contact_with_subject(db_session: AsyncSession):
    data = ContactCreate(
        name="Business",
        email="biz@example.com",
        subject="Partnership Inquiry",
        body="We would like to explore a partnership opportunity.",
    )
    msg = await service.create_contact_message(db_session, data)
    assert msg.subject == "Partnership Inquiry"
