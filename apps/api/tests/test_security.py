"""Unit tests for core/security.py — no database required."""
from __future__ import annotations

import time
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from jose import JWTError, jwt

from core.config import settings
from core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    generate_secure_token,
    hash_password,
    verify_password,
)


# ── Password helpers ──────────────────────────────────────────────────────────


def test_hash_password_returns_string():
    hashed = hash_password("secret")
    assert isinstance(hashed, str)
    assert hashed != "secret"


def test_verify_password_correct():
    plain = "myP@ssword!"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("correct")
    assert verify_password("wrong", hashed) is False


def test_hash_is_deterministic_but_salted():
    hashed1 = hash_password("same")
    hashed2 = hash_password("same")
    # bcrypt uses a random salt — two hashes of the same password differ
    assert hashed1 != hashed2
    assert verify_password("same", hashed1)
    assert verify_password("same", hashed2)


# ── Token creation ────────────────────────────────────────────────────────────


def test_create_access_token_is_valid_jwt():
    uid = uuid4()
    token = create_access_token(uid, "member")
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["sub"] == str(uid)
    assert payload["type"] == "access"
    assert payload["role"] == "member"


def test_create_access_token_expires_in_future():
    token = create_access_token(uuid4())
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["exp"] > time.time()


def test_create_refresh_token_type():
    token = create_refresh_token(uuid4())
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["type"] == "refresh"


def test_create_email_verification_token_type():
    token = create_email_verification_token(uuid4())
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["type"] == "email_verify"


def test_create_password_reset_token_type():
    token = create_password_reset_token(uuid4())
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["type"] == "password_reset"


def test_tokens_have_unique_jti():
    uid = uuid4()
    t1 = create_access_token(uid)
    t2 = create_access_token(uid)
    p1 = jwt.decode(t1, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    p2 = jwt.decode(t2, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert p1["jti"] != p2["jti"]


# ── decode_token ──────────────────────────────────────────────────────────────


def test_decode_token_access():
    uid = uuid4()
    token = create_access_token(uid, "admin")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == str(uid)
    assert payload["role"] == "admin"


def test_decode_token_wrong_type_raises():
    token = create_refresh_token(uuid4())
    with pytest.raises(JWTError):
        decode_token(token, expected_type="access")


def test_decode_token_tampered_raises():
    token = create_access_token(uuid4())
    tampered = token[:-4] + "XXXX"
    with pytest.raises(JWTError):
        decode_token(tampered)


def test_decode_token_expired_raises():
    uid = uuid4()
    now = datetime.now(UTC)
    payload = {
        "sub": str(uid),
        "type": "access",
        "iat": now - timedelta(hours=2),
        "exp": now - timedelta(hours=1),  # already expired
        "jti": "test-jti",
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    with pytest.raises(JWTError):
        decode_token(token)


# ── generate_secure_token ─────────────────────────────────────────────────────


def test_generate_secure_token_is_string():
    token = generate_secure_token()
    assert isinstance(token, str)
    assert len(token) > 0


def test_generate_secure_token_is_unique():
    assert generate_secure_token() != generate_secure_token()
