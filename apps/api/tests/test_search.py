"""Integration tests for /api/v1/search endpoint."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


def _mock_search_response(query: str = "test") -> dict:
    return {
        "posts": [],
        "users": [],
        "total_posts": 0,
        "total_users": 0,
        "query": query,
        "page": 1,
        "page_size": 20,
    }


# ── GET /search ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_search_requires_query(client: AsyncClient):
    response = await client.get("/api/v1/search")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_returns_valid_shape(client: AsyncClient):
    mock_result = _mock_search_response("python")
    with patch("modules.search.service.search", new=AsyncMock(return_value=mock_result)):
        response = await client.get("/api/v1/search?q=python")
    assert response.status_code == 200
    body = response.json()
    assert "posts" in body
    assert "users" in body
    assert "total_posts" in body
    assert "total_users" in body
    assert "query" in body


@pytest.mark.asyncio
async def test_search_invalid_type_filter(client: AsyncClient):
    response = await client.get("/api/v1/search?q=test&type=invalid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_filter_by_post_type(client: AsyncClient):
    mock_result = _mock_search_response("test")
    with patch("modules.search.service.search", new=AsyncMock(return_value=mock_result)):
        response = await client.get("/api/v1/search?q=test&type=post")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_search_filter_by_user_type(client: AsyncClient):
    mock_result = _mock_search_response("test")
    with patch("modules.search.service.search", new=AsyncMock(return_value=mock_result)):
        response = await client.get("/api/v1/search?q=test&type=user")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_search_pagination(client: AsyncClient):
    mock_result = _mock_search_response("code")
    with patch("modules.search.service.search", new=AsyncMock(return_value=mock_result)):
        response = await client.get("/api/v1/search?q=code&page=2&page_size=10")
    assert response.status_code == 200
