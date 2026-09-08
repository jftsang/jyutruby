import os

from dotenv import load_dotenv

load_dotenv()


def _required(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise RuntimeError(f"Environment variable {name!r} must be set (check your .env)")
    return value


# WebAuthn Relying Party identity
RP_ID: str = _required("RP_ID")
RP_NAME: str = _required("RP_NAME")

# Origins which are allowed to perform WebAuthn ceremonies.
# For local development against uvicorn this defaults to http://localhost:8000
ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in _required("ALLOWED_ORIGINS").split(",") if o.strip()
]

# Secret used to sign session cookies. Override in production!
SESSION_SECRET: str = _required("SESSION_SECRET")

# SQLAlchemy database URL. Defaults to a local SQLite file, but this can be set to any
# SQLAlchemy URL (e.g. postgresql+psycopg://user:pass@host/db) for production.
DATABASE_URL: str = _required("DATABASE_URL")
