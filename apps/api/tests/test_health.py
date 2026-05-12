"""Tests for the /health endpoint."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_ok(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "env" in body


@pytest.mark.asyncio
async def test_health_env_is_test(client: AsyncClient):
    response = await client.get("/health")
    assert response.json()["env"] == "test"
