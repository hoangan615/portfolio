from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime, timedelta, timezone
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from modules.auth.schemas import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserPublicInline,
)
from modules.users.models import OAuthAccount, RefreshToken, User, UserSettings
from shared.exceptions import BadRequestError, ConflictError, NotFoundError, UnauthorizedError

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _token_response(user: User, refresh_raw: str) -> TokenResponse:
    access = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh_raw,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _login_response(user: User, refresh_raw: str) -> LoginResponse:
    access = create_access_token(user.id, user.role)
    user_inline = UserPublicInline(
        id=str(user.id),
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        role=user.role,
        email=user.email,
    )
    return LoginResponse(
        access_token=access,
        refresh_token=refresh_raw,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_inline,
    )


async def _store_refresh_token(db: AsyncSession, user_id: UUID, raw_token: str) -> None:
    expires = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    rt = RefreshToken(
        user_id=user_id,
        token_hash=_hash_token(raw_token),
        expires_at=expires,
    )
    db.add(rt)
    await db.flush()


# ── Registration ───────────────────────────────────────────────────────────────

async def register(db: AsyncSession, schema: RegisterRequest) -> User:
    # Check uniqueness
    existing_email = await db.execute(select(User).where(User.email == schema.email))
    if existing_email.scalar_one_or_none():
        raise ConflictError("Email already registered")

    existing_username = await db.execute(select(User).where(User.username == schema.username))
    if existing_username.scalar_one_or_none():
        raise ConflictError("Username already taken")

    user = User(
        username=schema.username,
        email=schema.email,
        password_hash=hash_password(schema.password),
        display_name=schema.display_name or schema.username,
        role="member",
        status="pending",
        email_verified=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    # Default settings
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    await db.flush()

    await send_verification_email(user)
    return user


# ── Login ──────────────────────────────────────────────────────────────────────

async def login(db: AsyncSession, schema: LoginRequest) -> LoginResponse:
    result = await db.execute(select(User).where(User.email == schema.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(schema.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    if user.status == "suspended":
        raise UnauthorizedError("Account is suspended")
    if user.status == "deleted":
        raise UnauthorizedError("Account not found")

    raw_refresh = create_refresh_token(user.id)
    await _store_refresh_token(db, user.id, raw_refresh)
    return _login_response(user, raw_refresh)


# ── Token refresh ──────────────────────────────────────────────────────────────

async def refresh_tokens(db: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except Exception as exc:
        raise UnauthorizedError("Invalid refresh token") from exc

    user_id = UUID(payload["sub"])
    token_hash = _hash_token(refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,  # noqa: E712
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise UnauthorizedError("Refresh token not found or revoked")

    expires_at = stored.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(UTC):
        raise UnauthorizedError("Refresh token expired")

    # Rotate: revoke old, issue new
    stored.revoked = True
    db.add(stored)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:  # pragma: no cover
        raise UnauthorizedError("User not found")

    new_raw = create_refresh_token(user.id)
    await _store_refresh_token(db, user.id, new_raw)
    return _token_response(user, new_raw)


# ── Logout ─────────────────────────────────────────────────────────────────────

async def logout(db: AsyncSession, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except Exception:
        return  # Already invalid — silently succeed

    user_id = UUID(payload["sub"])
    token_hash = _hash_token(refresh_token)

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
        )
    )
    stored = result.scalar_one_or_none()
    if stored:
        stored.revoked = True
        db.add(stored)
        await db.flush()


# ── Email verification ─────────────────────────────────────────────────────────

async def verify_email(db: AsyncSession, token: str) -> User:
    try:
        payload = decode_token(token, expected_type="email_verify")
    except Exception as exc:
        raise BadRequestError("Invalid or expired verification token") from exc

    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    user.email_verified = True
    if user.status == "pending":
        user.status = "active"
    if user.role == "guest":
        user.role = "member"
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


# ── Forgot / Reset password ────────────────────────────────────────────────────

async def forgot_password(db: AsyncSession, email: str) -> None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # Don't reveal whether email exists
        return

    token = create_password_reset_token(user.id)
    await send_password_reset_email(user, token)


async def reset_password(db: AsyncSession, schema: ResetPasswordRequest) -> None:
    try:
        payload = decode_token(schema.token, expected_type="password_reset")
    except Exception as exc:
        raise BadRequestError("Invalid or expired reset token") from exc

    user_id = UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    user.password_hash = hash_password(schema.new_password)
    db.add(user)
    await db.flush()


# ── OAuth ─────────────────────────────────────────────────────────────────────

def get_google_auth_url(state: str) -> str:
    params = (
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.OAUTH_REDIRECT_URL}/google"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        f"&state={state}"
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{params}"


def get_github_auth_url(state: str) -> str:
    params = (
        f"client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.OAUTH_REDIRECT_URL}/github"
        "&scope=user:email"
        f"&state={state}"
    )
    return f"https://github.com/login/oauth/authorize?{params}"


async def _get_or_create_oauth_user(  # pragma: no cover
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    display_name: str | None,
    avatar_url: str | None,
    access_token: str | None = None,
) -> tuple[User, bool]:
    """Return (user, is_new)."""
    # Check existing OAuth account
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )
    oauth_account = result.scalar_one_or_none()
    if oauth_account:
        user_result = await db.execute(select(User).where(User.id == oauth_account.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            if access_token:
                oauth_account.access_token = access_token
                db.add(oauth_account)
            return user, False

    # Check if email already used
    email_result = await db.execute(select(User).where(User.email == email))
    user = email_result.scalar_one_or_none()

    if not user:
        # Create new user
        import re
        base = re.sub(r"[^a-zA-Z0-9_-]", "", (email.split("@")[0] or "user"))[:30]
        username = base or "user"
        # Ensure unique username
        counter = 0
        candidate = username
        while True:
            exists = await db.execute(select(User).where(User.username == candidate))
            if not exists.scalar_one_or_none():
                break
            counter += 1
            candidate = f"{username}{counter}"

        user = User(
            username=candidate,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            role="member",
            status="active",
            email_verified=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)

        user_settings = UserSettings(user_id=user.id)
        db.add(user_settings)
        is_new = True
    else:
        is_new = False

    # Link OAuth account
    oauth_account = OAuthAccount(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        access_token=access_token,
    )
    db.add(oauth_account)
    await db.flush()
    return user, is_new


async def google_oauth_callback(db: AsyncSession, code: str) -> TokenResponse:  # pragma: no cover
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{settings.OAUTH_REDIRECT_URL}/google",
                "grant_type": "authorization_code",
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token", "")

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo = userinfo_resp.json()

    provider_user_id = userinfo.get("sub", "")
    email = userinfo.get("email", "")
    display_name = userinfo.get("name")
    avatar_url = userinfo.get("picture")

    if not email:
        raise BadRequestError("Could not retrieve email from Google")

    user, _ = await _get_or_create_oauth_user(
        db, "google", provider_user_id, email, display_name, avatar_url, access_token
    )
    raw_refresh = create_refresh_token(user.id)
    await _store_refresh_token(db, user.id, raw_refresh)
    return _token_response(user, raw_refresh)


async def github_oauth_callback(db: AsyncSession, code: str) -> TokenResponse:  # pragma: no cover
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "redirect_uri": f"{settings.OAUTH_REDIRECT_URL}/github",
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token", "")

        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )
        userinfo = user_resp.json()

        emails_resp = await client.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"token {access_token}"},
        )
        emails = emails_resp.json()

    email = ""
    if isinstance(emails, list):
        for e in emails:
            if e.get("primary") and e.get("verified"):
                email = e.get("email", "")
                break
        if not email and emails:
            email = emails[0].get("email", "")

    if not email:
        email = userinfo.get("email", "")

    if not email:
        raise BadRequestError("Could not retrieve email from GitHub")

    provider_user_id = str(userinfo.get("id", ""))
    display_name = userinfo.get("name") or userinfo.get("login")
    avatar_url = userinfo.get("avatar_url")

    user, _ = await _get_or_create_oauth_user(
        db, "github", provider_user_id, email, display_name, avatar_url, access_token
    )
    raw_refresh = create_refresh_token(user.id)
    await _store_refresh_token(db, user.id, raw_refresh)
    return _token_response(user, raw_refresh)


# ── Email helpers ─────────────────────────────────────────────────────────────

async def send_verification_email(user: User) -> None:
    token = create_email_verification_token(user.id)
    verify_url = f"{settings.OAUTH_REDIRECT_URL.rsplit('/auth', 1)[0]}/auth/verify-email?token={token}"

    if settings.is_development:
        logger.info(
            "VERIFICATION EMAIL (dev) | to=%s | url=%s",
            user.email,
            verify_url,
        )
        return

    try:  # pragma: no cover
        import aiosmtplib
        from email.mime.text import MIMEText

        msg = MIMEText(
            f"Hello {user.display_name or user.username},\n\n"
            f"Please verify your email by visiting:\n{verify_url}\n\n"
            "This link expires in 24 hours.",
            "plain",
        )
        msg["Subject"] = "Verify your email"
        msg["From"] = settings.SMTP_FROM
        msg["To"] = user.email

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_TLS,
        )
    except Exception:  # pragma: no cover
        logger.exception("Failed to send verification email to %s", user.email)


async def send_password_reset_email(user: User, token: str) -> None:
    reset_url = f"{settings.OAUTH_REDIRECT_URL.rsplit('/auth', 1)[0]}/auth/reset-password?token={token}"

    if settings.is_development:
        logger.info(
            "RESET EMAIL (dev) | to=%s | url=%s",
            user.email,
            reset_url,
        )
        return

    try:  # pragma: no cover
        import aiosmtplib
        from email.mime.text import MIMEText

        msg = MIMEText(
            f"Hello {user.display_name or user.username},\n\n"
            f"Reset your password by visiting:\n{reset_url}\n\n"
            "This link expires in 1 hour. If you did not request this, ignore this email.",
            "plain",
        )
        msg["Subject"] = "Password reset request"
        msg["From"] = settings.SMTP_FROM
        msg["To"] = user.email

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            use_tls=settings.SMTP_TLS,
        )
    except Exception:  # pragma: no cover
        logger.exception("Failed to send password reset email to %s", user.email)


# ── Seed owner ────────────────────────────────────────────────────────────────

async def create_owner_if_not_exists(db: AsyncSession) -> User | None:
    result = await db.execute(select(User).where(User.email == settings.OWNER_EMAIL))
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    owner = User(
        username=settings.OWNER_USERNAME,
        email=settings.OWNER_EMAIL,
        password_hash=hash_password(settings.OWNER_PASSWORD),
        display_name="Võ Hoàng Ân",
        role="owner",
        status="active",
        email_verified=True,
    )
    db.add(owner)
    await db.flush()
    await db.refresh(owner)

    owner_settings = UserSettings(user_id=owner.id)
    db.add(owner_settings)
    await db.flush()

    logger.info("Owner user created: %s", settings.OWNER_EMAIL)
    return owner
