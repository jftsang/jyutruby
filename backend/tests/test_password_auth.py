def register(client, username, password="secret123", display_name=""):
    r = client.post(
        "/api/auth/password/register",
        json={"username": username, "display_name": display_name, "password": password},
    )
    return r


def test_password_register_success_sets_session(client):
    r = register(client, "alice", display_name="Alice Smith")
    assert r.status_code == 201
    assert r.json() == {"user_id": 1}
    assert "session" in r.cookies

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json()["username"] == "alice"
    assert me.json()["display_name"] == "Alice Smith"


def test_password_register_defaults_display_name_to_username(client):
    r = register(client, "bob", display_name="")
    assert r.status_code == 201

    me = client.get("/api/auth/me")
    assert me.json()["username"] == "bob"
    assert me.json()["display_name"] == "bob"


def test_password_register_lowercases_username(client):
    r = register(client, "Carol")
    assert r.status_code == 201


def test_password_register_duplicate_username_is_rejected(client):
    assert register(client, "carol").status_code == 201
    # Same username, different case, should still collide.
    r = register(client, "CAROL", password="other123")
    assert r.status_code == 409
    assert r.json()["detail"] == "Username is already taken"


def test_password_register_rejects_invalid_username(client):
    r = register(client, "bad user!", password="password1")
    assert r.status_code == 400
    assert "letters, numbers, and underscores" in r.json()["detail"]


def test_password_register_rejects_empty_password(client):
    r = register(client, "newuser", password="")
    assert r.status_code == 400
    assert r.json()["detail"] == "Password is required"


def test_password_login_success_case_insensitive(client):
    register(client, "alice", password="secret123")
    r = client.post(
        "/api/auth/password/login",
        json={"username": "ALICE", "password": "secret123"},
    )
    assert r.status_code == 200
    assert r.json() == {"user_id": 1}


def test_password_login_wrong_password(client):
    register(client, "alice", password="secret123")
    r = client.post(
        "/api/auth/password/login",
        json={"username": "alice", "password": "wrongpassword"},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid username or password"


def test_password_login_unknown_user(client):
    r = client.post(
        "/api/auth/password/login",
        json={"username": "nobody", "password": "whatever"},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Invalid username or password"


def test_password_login_for_user_without_password(client, session):
    from backend.db import AuthMethod, User

    user = User(username="passkeyonly", display_name="Passkey Only")
    session.add(user)
    session.flush()
    session.add(AuthMethod(user_id=user.id, type="webauthn", identifier="dGVzdA"))
    session.commit()

    r = client.post(
        "/api/auth/password/login",
        json={"username": "passkeyonly", "password": "whatever"},
    )
    assert r.status_code == 400
    assert "no password" in r.json()["detail"].lower()


def test_me_requires_login(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_logout_clears_session(client):
    register(client, "alice")
    assert client.get("/api/auth/me").status_code == 200

    r = client.post("/api/auth/logout")
    assert r.status_code == 200
    assert client.get("/api/auth/me").status_code == 401