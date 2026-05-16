"""Unit tests for shared/pagination.py, shared/exceptions.py, shared/dependencies.py."""
from __future__ import annotations

import pytest

from shared.exceptions import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InternalError,
    NotFoundError,
    TooManyRequestsError,
    UnauthorizedError,
    UnprocessableError,
)
from shared.pagination import CursorParams, CursorResponse, PageParams


# ── PageParams ────────────────────────────────────────────────────────────────


def test_page_params_offset():
    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 20
    assert p.offset == 0
    assert p.limit == 20


def test_page_params_offset_page2():
    p = PageParams.__new__(PageParams)
    p.page = 3
    p.page_size = 10
    assert p.offset == 20
    assert p.limit == 10


def test_paged_response_create_first_page():
    from shared.pagination import PagedResponse

    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 10
    resp = PagedResponse.create(list(range(10)), total=25, params=p)
    assert resp.total == 25
    assert resp.pages == 3
    assert resp.has_next is True
    assert resp.has_prev is False
    assert len(resp.items) == 10


def test_paged_response_create_last_page():
    from shared.pagination import PagedResponse

    p = PageParams.__new__(PageParams)
    p.page = 3
    p.page_size = 10
    resp = PagedResponse.create(list(range(5)), total=25, params=p)
    assert resp.has_next is False
    assert resp.has_prev is True


def test_paged_response_zero_total():
    from shared.pagination import PagedResponse

    p = PageParams.__new__(PageParams)
    p.page = 1
    p.page_size = 10
    resp = PagedResponse.create([], total=0, params=p)
    assert resp.pages == 1
    assert resp.has_next is False
    assert resp.has_prev is False


# ── CursorParams ──────────────────────────────────────────────────────────────


def test_cursor_params_decode_none():
    cp = CursorParams.__new__(CursorParams)
    cp.cursor = None
    cp.limit = 20
    assert cp.decode_cursor() is None


def test_cursor_params_decode_valid():
    import base64
    import json

    data = {"created_at": "2024-01-01T00:00:00"}
    raw = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip("=")

    cp = CursorParams.__new__(CursorParams)
    cp.cursor = raw
    cp.limit = 20
    decoded = cp.decode_cursor()
    assert decoded == data


def test_cursor_params_decode_invalid():
    cp = CursorParams.__new__(CursorParams)
    cp.cursor = "not-valid-base64!!!"
    cp.limit = 20
    assert cp.decode_cursor() is None


# ── CursorResponse ────────────────────────────────────────────────────────────


def test_cursor_response_no_more():
    items = [{"id": i, "created_at": "2024-01-01"} for i in range(3)]
    resp = CursorResponse.create(items, limit=5, cursor_field="created_at")
    assert resp.has_more is False
    assert resp.next_cursor is None
    assert len(resp.items) == 3


def test_cursor_response_has_more():
    items = [{"id": i, "created_at": f"2024-01-0{i+1}"} for i in range(6)]
    resp = CursorResponse.create(items, limit=5, cursor_field="created_at")
    assert resp.has_more is True
    assert resp.next_cursor is not None
    assert len(resp.items) == 5


def test_cursor_response_encode_decode():
    import base64
    import json

    data = {"ts": "2024-06-01"}
    encoded = CursorResponse.encode_cursor(data)
    decoded = json.loads(base64.urlsafe_b64decode(encoded + "==").decode())
    assert decoded == data


def test_cursor_response_cursor_field_from_dict():
    """val = last.get(cursor_field) branch when item is dict."""
    items = [{"id": i, "ts": f"2024-01-0{i+1}"} for i in range(6)]
    resp = CursorResponse.create(items, limit=5, cursor_field="ts")
    assert resp.has_more is True
    assert resp.next_cursor is not None


# ── Exceptions ────────────────────────────────────────────────────────────────


def test_not_found_error():
    exc = NotFoundError("Post")
    assert exc.status_code == 404
    assert "Post" in str(exc.detail)


def test_unauthorized_error():
    exc = UnauthorizedError("Token expired")
    assert exc.status_code == 401


def test_forbidden_error():
    exc = ForbiddenError("No access")
    assert exc.status_code == 403


def test_conflict_error():
    exc = ConflictError("Already exists")
    assert exc.status_code == 409


def test_bad_request_error():
    exc = BadRequestError("Invalid input")
    assert exc.status_code == 400


def test_unprocessable_error():
    exc = UnprocessableError("bad data")
    assert exc.status_code == 422


def test_too_many_requests_error():
    exc = TooManyRequestsError()
    assert exc.status_code == 429


def test_internal_error():
    exc = InternalError()
    assert exc.status_code == 500


# ── CursorParams init ─────────────────────────────────────────────────────────


def test_cursor_params_init_sets_attrs():
    cp = CursorParams(cursor=None, limit=15)
    assert cp.cursor is None
    assert cp.limit == 15


# ── Config validator ──────────────────────────────────────────────────────────


def test_config_parse_allowed_hosts_json_string():
    from core.config import Settings
    result = Settings.parse_allowed_hosts('["localhost", "example.com"]')
    assert result == ["localhost", "example.com"]


def test_config_parse_allowed_hosts_comma_separated():
    from core.config import Settings
    result = Settings.parse_allowed_hosts("localhost, example.com")
    assert result == ["localhost", "example.com"]


def test_config_parse_allowed_hosts_list_passthrough():
    from core.config import Settings
    result = Settings.parse_allowed_hosts(["localhost"])
    assert result == ["localhost"]


# ── StorageClient.get_url ─────────────────────────────────────────────────────


def test_storage_get_url():
    from core.storage import StorageClient
    client = StorageClient.__new__(StorageClient)
    client.public_url = "https://cdn.example.com"
    assert client.get_url("media/test.jpg") == "https://cdn.example.com/media/test.jpg"


def test_storage_build_key_with_user():
    from core.storage import StorageClient
    key = StorageClient.build_key("media/original", "photo.jpg", "user-123")
    assert key.startswith("media/original/user-123/")
    assert "photo" in key
    assert key.endswith(".jpg")


def test_storage_build_key_without_user():
    from core.storage import StorageClient
    key = StorageClient.build_key("media/original", "photo.jpg")
    assert key.startswith("media/original/")
    assert "photo" in key


def test_storage_delete_objects_empty_keys():
    from core.storage import StorageClient
    client = StorageClient.__new__(StorageClient)
    # Should return immediately without error when keys is empty
    client.delete_objects([])


# ── UserUpdateSchema URL validator ────────────────────────────────────────────


def test_user_update_schema_valid_url():
    from modules.users.schemas import UserUpdate
    schema = UserUpdate(website_url="https://example.com")
    assert schema.website_url == "https://example.com"


def test_user_update_schema_invalid_url():
    from pydantic import ValidationError
    from modules.users.schemas import UserUpdate
    with pytest.raises(ValidationError):
        UserUpdate(website_url="not-a-url")


# ── Dependencies: ROLE_HIERARCHY ──────────────────────────────────────────────


def test_role_hierarchy_ordering():
    from shared.dependencies import ROLE_HIERARCHY

    assert ROLE_HIERARCHY["owner"] > ROLE_HIERARCHY["admin"]
    assert ROLE_HIERARCHY["admin"] > ROLE_HIERARCHY["moderator"]
    assert ROLE_HIERARCHY["moderator"] > ROLE_HIERARCHY["member"]
    assert ROLE_HIERARCHY["member"] > ROLE_HIERARCHY["restricted"]
    assert ROLE_HIERARCHY["restricted"] > ROLE_HIERARCHY["guest"]
    assert ROLE_HIERARCHY["banned"] == 0
