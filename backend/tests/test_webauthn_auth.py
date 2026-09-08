import json


def _add_webauthn_user(session, username="ima", display_name="IMA"):
    from backend.db import AuthMethod, User

    user = User(username=username, display_name=display_name)
    session.add(user)
    session.flush()
    session.add(
        AuthMethod(
            user_id=user.id,
            type="webauthn",
            identifier="dGVzdA",  # base64url for b"test"
            public_key=b"\x04dummy",
        )
    )
    session.commit()
    return user


def test_webauthn_register_options_success(client):
    r = client.post(
        "/api/auth/webauthn/register/options",
        json={"username": "newbie", "display_name": "Newbie"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["challenge_id"]
    options = json.loads(data["options"])
    assert options["user"]["name"] == "newbie"


def test_webauthn_register_options_rejects_invalid_username(client):
    r = client.post(
        "/api/auth/webauthn/register/options",
        json={"username": "no spaces here", "display_name": ""},
    )
    assert r.status_code == 400


def test_webauthn_register_options_rejects_duplicate_username(client):
    r = client.post(
        "/api/auth/password/register",
        json={"username": "alice", "display_name": "", "password": "secret123"},
    )
    assert r.status_code == 201

    r = client.post(
        "/api/auth/webauthn/register/options",
        json={"username": "alice", "display_name": ""},
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "Username is already taken"


def test_webauthn_login_options_success_case_insensitive(client, session):
    _add_webauthn_user(session, username="ima", display_name="IMA")
    r = client.post(
        "/api/auth/webauthn/login/options",
        json={"username": "IMA"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["challenge_id"]
    options = json.loads(data["options"])
    assert [c["id"] for c in options["allowCredentials"]] == ["dGVzdA"]


def test_webauthn_login_options_unknown_user(client):
    r = client.post(
        "/api/auth/webauthn/login/options",
        json={"username": "nobody"},
    )
    assert r.status_code == 404


def test_webauthn_login_options_user_without_passkey(client):
    r = client.post(
        "/api/auth/password/register",
        json={"username": "bob", "display_name": "", "password": "secret123"},
    )
    assert r.status_code == 201

    r = client.post(
        "/api/auth/webauthn/login/options",
        json={"username": "bob"},
    )
    assert r.status_code == 404
    assert "No WebAuthn credential" in r.json()["detail"]