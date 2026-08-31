import base64
import secrets
import typing

import fastapi
from fastapi import Depends, HTTPException
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from webauthn import (
    base64url_to_bytes,
    generate_authentication_options,
    generate_registration_options,
    options_to_json,
    verify_authentication_response,
    verify_registration_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from webauthn.registration.verify_registration_response import VerifiedRegistration

from backend import config
from backend.db import AuthMethod, User, get_db

router = fastapi.APIRouter()

COOKIE_NAME = "session"

# Simple in-memory store of pending challenges, keyed by a one-time challenge id.
# A real multi-process deployment would use a shared store (e.g. redis).
_PENDING: dict[str, dict] = {}

_session_serializer = URLSafeTimedSerializer(config.SESSION_SECRET)


class RegistrationOptionsRequest(BaseModel):
    username: str
    display_name: str


class VerifyRegistrationRequest(BaseModel):
    challenge_id: str
    response: typing.Any


class LoginOptionsRequest(BaseModel):
    username: str


class VerifyLoginRequest(BaseModel):
    challenge_id: str
    response: typing.Any


def _get_current_user_id(request: fastapi.Request) -> int | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        return _session_serializer.loads(token, max_age=60 * 60 * 24 * 30)
    except (BadSignature, SignatureExpired, TypeError):
        return None


def _set_session(response: fastapi.Response, user_id: int) -> None:
    token = _session_serializer.dumps(user_id)
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        samesite="lax",
        secure=False,
    )


@router.post("/api/auth/webauthn/register/options")
def webauthn_register_options(
    body: RegistrationOptionsRequest, db: Session = Depends(get_db)
) -> dict:
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    challenge_id = secrets.token_urlsafe(32)
    options = generate_registration_options(
        rp_id=config.RP_ID,
        rp_name=config.RP_NAME,
        user_name=username,
        user_display_name=body.display_name.strip() or username,
        authenticator_selection=AuthenticatorSelectionCriteria(
            resident_key=ResidentKeyRequirement.DISCOURAGED,
            user_verification=UserVerificationRequirement.PREFERRED,
        ),
        exclude_credentials=[],
    )
    _PENDING[challenge_id] = {
        "step": "register",
        "username": username,
        "challenge": options.challenge,
    }
    return {"challenge_id": challenge_id, "options": options_to_json(options)}


@router.post("/api/auth/webauthn/register/verify")
def webauthn_register_verify(
    body: VerifyRegistrationRequest, db: Session = Depends(get_db)
) -> dict:
    pending = _PENDING.pop(body.challenge_id, None)
    if not pending or pending["step"] != "register":
        raise HTTPException(status_code=400, detail="Invalid challenge")

    try:
        verified: VerifiedRegistration = verify_registration_response(
            credential=body.response,
            expected_challenge=pending["challenge"],
            expected_rp_id=config.RP_ID,
            expected_origin=config.ALLOWED_ORIGINS,
            require_user_verification=False,
        )
    except Exception as exc:  # noqa: BLE001 - surface any webauthn error
        raise HTTPException(status_code=400, detail=f"Registration failed: {exc}") from exc

    user = User(display_name=pending["username"])
    db.add(user)
    db.flush()
    credential_public_key = verified.credential_public_key
    db.add(
        AuthMethod(
            user_id=user.id,
            type="webauthn",
            identifier=base64.urlsafe_b64encode(verified.credential_id)
            .decode("ascii")
            .rstrip("="),
            public_key=credential_public_key,
        )
    )
    db.commit()
    db.refresh(user)

    response = fastapi.responses.JSONResponse(content={"user_id": user.id}, status_code=201)
    _set_session(response, user.id)
    return response


@router.post("/api/auth/webauthn/login/options")
def webauthn_login_options(
    body: LoginOptionsRequest, db: Session = Depends(get_db)
) -> dict:
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    user = db.query(User).filter(User.display_name == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Unknown user")

    methods = (
        db.query(AuthMethod)
        .filter(AuthMethod.user_id == user.id, AuthMethod.type == "webauthn")
        .all()
    )
    if not methods:
        raise HTTPException(status_code=404, detail="No WebAuthn credential for this user")

    from webauthn.helpers.structs import PublicKeyCredentialDescriptor

    challenge_id = secrets.token_urlsafe(32)
    options = generate_authentication_options(
        rp_id=config.RP_ID,
        allow_credentials=[
            PublicKeyCredentialDescriptor(
                id=base64url_to_bytes(m.identifier),
            )
            for m in methods
        ],
        user_verification=UserVerificationRequirement.PREFERRED,
    )
    _PENDING[challenge_id] = {"step": "login", "challenge": options.challenge, "user": user}
    return {"challenge_id": challenge_id, "options": options_to_json(options)}


@router.post("/api/auth/webauthn/login/verify")
def webauthn_login_verify(
    body: VerifyLoginRequest, db: Session = Depends(get_db)
) -> dict:
    pending = _PENDING.pop(body.challenge_id, None)
    if not pending or pending["step"] != "login":
        raise HTTPException(status_code=400, detail="Invalid challenge")

    user: User = pending["user"]
    methods = (
        db.query(AuthMethod)
        .filter(AuthMethod.user_id == user.id, AuthMethod.type == "webauthn")
        .all()
    )

    try:
        expected_id = base64url_to_bytes(body.response["id"]) if "id" in body.response else None
    except (TypeError, ValueError):
        expected_id = None

    match = None
    for m in methods:
        if expected_id is None:
            match = m
            break
        if base64url_to_bytes(m.identifier) == expected_id:
            match = m
            break
    if match is None:
        raise HTTPException(status_code=400, detail="Credential not found")

    try:
        verify_authentication_response(
            credential=body.response,
            expected_challenge=pending["challenge"],
            expected_rp_id=config.RP_ID,
            expected_origin=config.ALLOWED_ORIGINS,
            credential_public_key=match.public_key,
            credential_current_sign_count=0,
            require_user_verification=False,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Login failed: {exc}") from exc

    response = fastapi.responses.JSONResponse(content={"user_id": user.id})
    _set_session(response, user.id)
    return response


@router.get("/api/auth/me")
def me(request: fastapi.Request, db: Session = Depends(get_db)):
    user_id = _get_current_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not logged in")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Unknown user")
    return {"user_id": user.id, "display_name": user.display_name}


@router.post("/api/auth/logout")
def logout(request: fastapi.Request, response: fastapi.Response):
    response.delete_cookie(COOKIE_NAME)
    return {"ok": True}
