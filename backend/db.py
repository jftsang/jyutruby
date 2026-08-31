from collections.abc import Generator

from sqlalchemy import ForeignKey, LargeBinary, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from backend.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    display_name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[str] = mapped_column(String, server_default="CURRENT_TIMESTAMP")

    auth_methods: Mapped[list["AuthMethod"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class AuthMethod(Base):
    __tablename__ = "auth_methods"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    # password | oauth_google | magic_link | webauthn
    type: Mapped[str] = mapped_column(String(32))
    # For webauthn this is the base64url credential id; for oauth, the oauth subject.
    identifier: Mapped[str] = mapped_column(String(512))
    # For webauthn this holds the credential public key bytes.
    public_key: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    # Reserved for future password hashes / magic links.
    secret_hash: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User] = relationship(back_populates="auth_methods")


# Schema is managed with Alembic (see alembic/ and alembic.ini).
# Run `alembic upgrade head` to apply migrations.


def get_db() -> Generator[SessionLocal, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
