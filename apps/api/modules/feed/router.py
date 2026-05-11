from __future__ import annotations

from fastapi import APIRouter, Depends

from modules.feed import schemas, service
from shared.dependencies import CurrentUser, DBDep, require_min_role
from shared.pagination import PageParams, PagedResponse

router = APIRouter(prefix="/feed", tags=["feed"])

AuthRequired = require_min_role("member")


@router.get("", response_model=PagedResponse[schemas.FeedItem], dependencies=[AuthRequired])
async def following_feed(current_user: CurrentUser, db: DBDep, params: PageParams = Depends()):
    items, total = await service.following_feed(db, current_user.id, params)  # type: ignore[union-attr]
    return PagedResponse.create(items, total, params)


@router.get("/global", response_model=PagedResponse[schemas.FeedItem])
async def global_feed(db: DBDep, params: PageParams = Depends()):
    items, total = await service.global_feed(db, params)
    return PagedResponse.create(items, total, params)


@router.get("/trending", response_model=PagedResponse[schemas.FeedItem])
async def trending_feed(db: DBDep, params: PageParams = Depends()):
    items, total = await service.trending_feed(db, params)
    return PagedResponse.create(items, total, params)


@router.get("/explore", response_model=PagedResponse[schemas.FeedItem], dependencies=[AuthRequired])
async def explore_feed(current_user: CurrentUser, db: DBDep, params: PageParams = Depends()):
    items, total = await service.explore_feed(db, current_user.id, params)  # type: ignore[union-attr]
    return PagedResponse.create(items, total, params)
