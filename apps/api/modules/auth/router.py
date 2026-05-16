from __future__ import annotations

import secrets

from fastapi import APIRouter, Cookie, Depends, Query, Response, status
from fastapi.responses import RedirectResponse

from modules.auth import schemas, service
from shared.dependencies import DBDep

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False,  # set True in production behind HTTPS
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE, httponly=True, samesite="lax")


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=schemas.MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(body: schemas.RegisterRequest, db: DBDep):
    await service.register(db, body)
    return schemas.MessageResponse(message="Registration successful. Please verify your email.")


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.TokenResponse)
async def login(body: schemas.LoginRequest, response: Response, db: DBDep):
    tokens = await service.login(db, body)
    _set_refresh_cookie(response, tokens.refresh_token)  # pragma: no cover
    return tokens  # pragma: no cover


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(
    response: Response,
    db: DBDep,
    body: schemas.RefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
):
    raw = (body.refresh_token if body else None) or refresh_token_cookie
    if not raw:
        from shared.exceptions import UnauthorizedError
        raise UnauthorizedError("No refresh token provided")
    tokens = await service.refresh_tokens(db, raw)
    _set_refresh_cookie(response, tokens.refresh_token)  # pragma: no cover
    return tokens  # pragma: no cover


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    db: DBDep,
    body: schemas.RefreshRequest | None = None,
    refresh_token_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
):
    raw = (body.refresh_token if body else None) or refresh_token_cookie
    if raw:
        await service.logout(db, raw)
    _clear_refresh_cookie(response)  # pragma: no cover


# ── Verify email ──────────────────────────────────────────────────────────────

@router.get("/verify-email", response_model=schemas.MessageResponse)
async def verify_email(token: str = Query(...), db: DBDep = None):  # type: ignore[assignment]
    await service.verify_email(db, token)
    return schemas.MessageResponse(message="Email verified successfully.")


# ── Forgot password ───────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=schemas.MessageResponse)
async def forgot_password(body: schemas.ForgotPasswordRequest, db: DBDep):
    await service.forgot_password(db, body.email)
    return schemas.MessageResponse(message="If that email exists, a reset link has been sent.")  # pragma: no cover


# ── Reset password ────────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=schemas.MessageResponse)
async def reset_password(body: schemas.ResetPasswordRequest, db: DBDep):
    await service.reset_password(db, body)
    return schemas.MessageResponse(message="Password reset successfully.")  # pragma: no cover


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google", response_model=schemas.OAuthURLResponse)
async def google_auth():
    state = secrets.token_urlsafe(16)
    url = service.get_google_auth_url(state)
    return schemas.OAuthURLResponse(url=url, state=state)


@router.get("/google/callback", response_model=schemas.TokenResponse)
async def google_callback(
    code: str = Query(...),
    state: str | None = Query(None),
    response: Response = None,  # type: ignore[assignment]
    db: DBDep = None,  # type: ignore[assignment]
):
    tokens = await service.google_oauth_callback(db, code)
    _set_refresh_cookie(response, tokens.refresh_token)
    return tokens


# ── GitHub OAuth ──────────────────────────────────────────────────────────────

@router.get("/github", response_model=schemas.OAuthURLResponse)
async def github_auth():
    state = secrets.token_urlsafe(16)
    url = service.get_github_auth_url(state)
    return schemas.OAuthURLResponse(url=url, state=state)


@router.get("/github/callback", response_model=schemas.TokenResponse)
async def github_callback(
    code: str = Query(...),
    state: str | None = Query(None),
    response: Response = None,  # type: ignore[assignment]
    db: DBDep = None,  # type: ignore[assignment]
):
    tokens = await service.github_oauth_callback(db, code)
    _set_refresh_cookie(response, tokens.refresh_token)
    return tokens
