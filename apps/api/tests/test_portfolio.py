"""Integration tests for /api/v1/portfolio/* endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.portfolio.models import PortfolioProfile, Skill
from modules.users.models import User


# ── Helper ────────────────────────────────────────────────────────────────────


async def _ensure_portfolio(db: AsyncSession, user: User) -> PortfolioProfile:
    profile = PortfolioProfile(
        user_id=user.id,
        headline="Full-Stack Developer",
        tagline="Building great things",
        about="About me text",
        github_url="https://github.com/testuser",
        open_to_work=True,
    )
    db.add(profile)
    await db.flush()
    return profile


# ── GET /portfolio ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_get_portfolio_authenticated(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.get("/api/v1/portfolio", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "profile" in body
    assert "skills" in body
    assert "experiences" in body
    assert "projects" in body


@pytest.mark.asyncio
async def test_get_portfolio_unauthenticated(client: AsyncClient):
    response = await client.get("/api/v1/portfolio")
    assert response.status_code == 401


# ── PUT /portfolio ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_update_portfolio(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.put(
        "/api/v1/portfolio",
        json={
            "headline": "Updated Headline",
            "tagline": "Updated tagline",
            "open_to_work": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["headline"] == "Updated Headline"
    assert body["open_to_work"] is False


# ── Skills ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_skill(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.post(
        "/api/v1/portfolio/skills",
        json={"name": "Python", "category": "Backend", "proficiency": 90},
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Python"
    assert body["proficiency"] == 90


@pytest.mark.asyncio
async def test_create_skill_proficiency_out_of_range(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.post(
        "/api/v1/portfolio/skills",
        json={"name": "Bad", "proficiency": 150},  # > 100
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_delete_skill(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    skill = Skill(user_id=regular_user.id, name="ToDelete", sort_order=0)
    db_session.add(skill)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/portfolio/skills/{skill.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


# ── Experiences ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_experience(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.post(
        "/api/v1/portfolio/experiences",
        json={
            "company": "Acme Corp",
            "title": "Engineer",
            "start_date": "2022-01",
            "is_current": True,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["company"] == "Acme Corp"
    assert body["is_current"] is True


# ── Projects ──────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_project(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.post(
        "/api/v1/portfolio/projects",
        json={
            "name": "Awesome App",
            "description": "A great project",
            "tech_stack": "Python, React",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Awesome App"


# ── Contact ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_contact_form(client: AsyncClient):
    response = await client.post(
        "/api/v1/portfolio/contact",
        json={
            "name": "Visitor",
            "email": "visitor@example.com",
            "message": "Hello, I would like to connect.",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Visitor"
