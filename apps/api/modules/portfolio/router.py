from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status

from modules.portfolio import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

MemberRequired = require_min_role("member")


# ── Portfolio (public read, authenticated write) ───────────────────────────────

@router.get("", response_model=schemas.PortfolioOut)
async def get_portfolio(current_user: CurrentUser, db: DBDep):
    data = await service.get_portfolio(db, current_user.id)  # type: ignore[union-attr]
    return data  # pragma: no cover


@router.put("", response_model=schemas.PortfolioProfileOut, dependencies=[MemberRequired])
async def update_portfolio(
    body: schemas.PortfolioProfileUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_portfolio(db, current_user.id, body)  # type: ignore[union-attr]


# ── Skills ────────────────────────────────────────────────────────────────────

@router.get("/skills", response_model=list[schemas.SkillOut])
async def list_skills(current_user: CurrentUser, db: DBDep):
    data = await service.get_portfolio(db, current_user.id)  # type: ignore[union-attr]
    return data["skills"]  # pragma: no cover


@router.post(
    "/skills",
    response_model=schemas.SkillOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def create_skill(
    body: schemas.SkillCreate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.create_skill(db, current_user.id, body)  # type: ignore[union-attr]


@router.put("/skills/{skill_id}", response_model=schemas.SkillOut, dependencies=[MemberRequired])
async def update_skill(
    skill_id: UUID,
    body: schemas.SkillUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_skill(db, skill_id, current_user.id, body)  # type: ignore[union-attr]


@router.delete(
    "/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[MemberRequired],
)
async def delete_skill(skill_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.delete_skill(db, skill_id, current_user.id)  # type: ignore[union-attr]


# ── Experiences ───────────────────────────────────────────────────────────────

@router.get("/experiences", response_model=list[schemas.ExperienceOut])
async def list_experiences(current_user: CurrentUser, db: DBDep):
    data = await service.get_portfolio(db, current_user.id)  # type: ignore[union-attr]
    return data["experiences"]  # pragma: no cover


@router.post(
    "/experiences",
    response_model=schemas.ExperienceOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def create_experience(
    body: schemas.ExperienceCreate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.create_experience(db, current_user.id, body)  # type: ignore[union-attr]


@router.put(
    "/experiences/{exp_id}",
    response_model=schemas.ExperienceOut,
    dependencies=[MemberRequired],
)
async def update_experience(
    exp_id: UUID,
    body: schemas.ExperienceUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_experience(db, exp_id, current_user.id, body)  # type: ignore[union-attr]


@router.delete(
    "/experiences/{exp_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[MemberRequired],
)
async def delete_experience(exp_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.delete_experience(db, exp_id, current_user.id)  # type: ignore[union-attr]


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get("/projects", response_model=list[schemas.ProjectOut])
async def list_projects(current_user: CurrentUser, db: DBDep):
    data = await service.get_portfolio(db, current_user.id)  # type: ignore[union-attr]
    return data["projects"]  # pragma: no cover


@router.post(
    "/projects",
    response_model=schemas.ProjectOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[MemberRequired],
)
async def create_project(
    body: schemas.ProjectCreate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.create_project(db, current_user.id, body)  # type: ignore[union-attr]


@router.put(
    "/projects/{proj_id}",
    response_model=schemas.ProjectOut,
    dependencies=[MemberRequired],
)
async def update_project(
    proj_id: UUID,
    body: schemas.ProjectUpdate,
    current_user: CurrentUser,
    db: DBDep,
):
    return await service.update_project(db, proj_id, current_user.id, body)  # type: ignore[union-attr]


@router.delete(
    "/projects/{proj_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[MemberRequired],
)
async def delete_project(proj_id: UUID, current_user: CurrentUser, db: DBDep):
    await service.delete_project(db, proj_id, current_user.id)  # type: ignore[union-attr]


# ── Contact ───────────────────────────────────────────────────────────────────

@router.post(
    "/contact",
    response_model=schemas.ContactOut,
    status_code=status.HTTP_201_CREATED,
)
async def contact(body: schemas.ContactCreate, db: DBDep):
    return await service.create_contact_message(db, body)
