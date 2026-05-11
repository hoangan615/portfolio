from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from modules.search import schemas, service
from shared.dependencies import DBDep
from shared.pagination import PageParams

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=schemas.SearchResponse)
async def search(
    db: DBDep,
    q: str = Query(..., min_length=1, description="Search query"),
    type: str | None = Query(None, pattern="^(post|user)$", description="Filter by type"),
    params: PageParams = Depends(),
):
    return await service.search(db, q, type, params)
