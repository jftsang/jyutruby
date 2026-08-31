import os

# WebAuthn Relying Party identity
RP_ID: str = os.getenv("RP_ID", "localhost")
RP_NAME: str = os.getenv("RP_NAME", "jyutruby")

# Origins which are allowed to perform WebAuthn ceremonies.
# For local development against uvicorn this defaults to http://localhost:8000
ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:8000").split(",")
]

# Secret used to sign session cookies. Override in production!
SESSION_SECRET: str = os.getenv("SESSION_SECRET", "change-me-in-production")

# SQLAlchemy database URL. Defaults to a local SQLite file, but this can be set to any
# SQLAlchemy URL (e.g. postgresql+psycopg://user:pass@host/db) for production.
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'app.db')}",
)
