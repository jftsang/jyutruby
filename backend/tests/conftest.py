import os
import tempfile

# Point the app at an isolated temp database before any backend module imports
# config (load_dotenv does not override variables already present in os.environ).
_tmpdir = tempfile.mkdtemp(prefix="jyutruby-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_tmpdir, 'test.db')}"

import pytest
from fastapi.testclient import TestClient

from backend.db import Base, SessionLocal, engine
from backend.main import app


@pytest.fixture(scope="session", autouse=True)
def _schema():
    # The temp DB is fresh per pytest run, so create the schema once.
    Base.metadata.create_all(engine)


@pytest.fixture()
def db(_schema):
    # Cheap per-test reset: wipe data only, leave the schema in place.
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
    yield


@pytest.fixture()
def session(db):
    s = SessionLocal()
    yield s
    s.close()


@pytest.fixture()
def client(db):
    with TestClient(app) as c:
        yield c