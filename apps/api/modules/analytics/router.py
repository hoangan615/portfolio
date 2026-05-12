from __future__ import annotations

from fastapi import APIRouter, Query

from modules.analytics import schemas, service
from shared.dependencies import DBDep, require_min_role

router = APIRouter(prefix="/admin/analytics", tags=["analytics"])

AdminRequired = require_min_role("admin")


@router.get(
    "",
    response_model=schemas.AnalyticsSummary,
    dependencies=[AdminRequired],
)
async def get_analytics(
    db: DBDep,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
):
    return await service.get_analytics_summary(db, days)
