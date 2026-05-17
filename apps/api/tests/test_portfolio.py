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
            # no end_date → current role
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["company"] == "Acme Corp"
    assert body["title"] == "Engineer"
    assert body["end_date"] is None


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
            "title": "Awesome App",
            "description": "A great project",
            "tech_stack": "Python, React",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Awesome App"


# ── Contact ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_list_skills(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.get("/api/v1/portfolio/skills", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_update_skill(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    skill = Skill(user_id=regular_user.id, name="Python", sort_order=0)
    db_session.add(skill)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/portfolio/skills/{skill.id}",
        json={"name": "Python 3", "proficiency": 95},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Python 3"


@pytest.mark.asyncio
async def test_list_experiences(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.get("/api/v1/portfolio/experiences", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_update_experience(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    from modules.portfolio.models import Experience
    await _ensure_portfolio(db_session, regular_user)
    exp = Experience(
        user_id=regular_user.id,
        company="Old Corp",
        title="Dev",
        start_date="2020-01",
        sort_order=0,
    )
    db_session.add(exp)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/portfolio/experiences/{exp.id}",
        json={"company": "New Corp", "title": "Senior Dev", "start_date": "2020-01"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["company"] == "New Corp"


@pytest.mark.asyncio
async def test_delete_experience(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    from modules.portfolio.models import Experience
    await _ensure_portfolio(db_session, regular_user)
    exp = Experience(
        user_id=regular_user.id,
        company="Del Corp",
        title="Dev",
        start_date="2021-01",
        sort_order=0,
    )
    db_session.add(exp)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/portfolio/experiences/{exp.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_list_projects(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    await _ensure_portfolio(db_session, regular_user)
    response = await client.get("/api/v1/portfolio/projects", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_update_project(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    from modules.portfolio.models import Project
    await _ensure_portfolio(db_session, regular_user)
    project = Project(
        user_id=regular_user.id,
        title="Old Project",
        sort_order=0,
    )
    db_session.add(project)
    await db_session.flush()

    response = await client.put(
        f"/api/v1/portfolio/projects/{project.id}",
        json={"title": "New Project", "description": "Updated"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Project"


@pytest.mark.asyncio
async def test_delete_project(
    client: AsyncClient,
    regular_user: User,
    db_session: AsyncSession,
    auth_headers: dict,
):
    from modules.portfolio.models import Project
    await _ensure_portfolio(db_session, regular_user)
    project = Project(
        user_id=regular_user.id,
        title="To Delete",
        sort_order=0,
    )
    db_session.add(project)
    await db_session.flush()

    response = await client.delete(
        f"/api/v1/portfolio/projects/{project.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


# ── Contact ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_contact_form(client: AsyncClient):
    response = await client.post(
        "/api/v1/portfolio/contact",
        json={
            "name": "Visitor",
            "email": "visitor@example.com",
            "body": "Hello, I would like to connect with you here.",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Visitor"
