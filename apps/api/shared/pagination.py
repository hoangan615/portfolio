from __future__ import annotations

import base64
import json
from typing import Any, Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class PageParams:
    """Dependency for offset/page-based pagination."""

    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    ) -> None:
        self.page = page
        self.page_size = page_size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PagedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int
    has_next: bool
    has_prev: bool

    @classmethod
    def create(cls, items: list[T], total: int, params: PageParams) -> "PagedResponse[T]":
        pages = max(1, -(-total // params.page_size))  # ceiling division
        return cls(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            pages=pages,
            has_next=params.page < pages,
            has_prev=params.page > 1,
        )


# ── Cursor pagination ─────────────────────────────────────────────────────────

class CursorParams:
    """Dependency for cursor-based pagination (feeds, timelines)."""

    def __init__(
        self,
        cursor: str | None = Query(None, description="Opaque cursor from previous response"),
        limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    ) -> None:
        self.cursor = cursor
        self.limit = limit

    def decode_cursor(self) -> dict[str, Any] | None:
        if not self.cursor:
            return None
        try:
            raw = base64.urlsafe_b64decode(self.cursor + "==").decode()
            return json.loads(raw)
        except Exception:
            return None


class CursorResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    items: list[T]
    next_cursor: str | None
    has_more: bool

    @staticmethod
    def encode_cursor(data: dict[str, Any]) -> str:
        raw = json.dumps(data, default=str)
        return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")

    @classmethod
    def create(
        cls,
        items: list[T],
        limit: int,
        cursor_field: str,
    ) -> "CursorResponse[T]":
        has_more = len(items) > limit
        if has_more:
            items = items[:limit]
        next_cursor: str | None = None
        if has_more and items:
            last = items[-1]
            val = getattr(last, cursor_field, None)
            if val is None and isinstance(last, dict):
                val = last.get(cursor_field)
            next_cursor = cls.encode_cursor({cursor_field: val})
        return cls(items=items, next_cursor=next_cursor, has_more=has_more)
