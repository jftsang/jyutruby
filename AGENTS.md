# jyutruby

Annotates Chinese text with Jyutping (Cantonese romanization) readings. Comes with a
reading/revision UI and a FastAPI backend that adds user authentication.

## Layout

- `src/` — frontend (TypeScript/Preact) built with Parcel
  - `src/index.html` — app entry point (imports `static/style.scss`)
  - `src/jyutruby.ts` — main frontend module
  - `src/sw.ts` — service worker (network-first for navigations, cache for static
    assets, never intercepts `/api/*`)
- `backend/` — FastAPI application
  - `backend/main.py` — app setup, adds auth router, mounts the built `dist/` as
    static files, and serves `/login` and `/signup` Jinja2 templates
  - `backend/auth.py` — WebAuthn registration/login routes and handlers
  - `backend/config.py` — env-driven settings (DB URL, RP ID, origins, session secret)
  - `backend/db.py` — SQLAlchemy models (`User`, `AuthMethod`) and session factory
  - `backend/templates/` — `base.html` plus `login.html`, `signup.html`
- `dist/` — generated frontend build output, served by the backend

## Environment

- Python 3.14+, managed with `uv`
- `uv.lock` / `pyproject.toml` define Python dependencies; `backend/requirements.txt`
  is the loose mirror for manual installs
- Frontend deps live in `node_modules` (package.json/package-lock.json)

## Build & run

Frontend build (outputs to `dist/`):

```sh
npm run build
# or for a dev watch server on port 1234
npm run devserver
```

Backend (run from the repo root so `backend` is importable):

```sh
uv run uvicorn backend.main:app --reload --port 8000
```

The backend serves the UI from `dist/` at `/`; auth pages live at `/login` and
`/signup`, and the WebAuthn API is under `/api/auth/webauthn/*`.

## Database

- Schema is managed with Alembic; apply migrations with `alembic upgrade head`
  (from the repo root).
- Defaults to a local SQLite file; switch to Postgres by setting `DATABASE_URL`
  plus the RP/session env vars (see `backend/config.py`). Raw config keys: `RP_ID`,
  `RP_NAME`, `ALLOWED_ORIGINS`, `SESSION_SECRET`, `DATABASE_URL`.

## Testing

Run the pytest suite (backend endpoints) from the repo root:

```sh
uv run pytest
```

Tests live in `backend/tests/`. `pytest` and `httpx2` are dev dependencies.
`conftest.py` redirects `DATABASE_URL` to a throwaway SQLite file, creates the
schema once per run, and wipes table data between tests, so the dev database is
never touched.

## Conventions

- Backend config is read from environment variables with sensible local defaults in
  `backend/config.py` — extend there rather than hard-coding.
- Do not commit `backend/*.db` or `.env` (both are gitignored).
- Keep auth flows WebAuthn-only for now; new methods (password/OAuth) should extend
  the `AuthMethod.type` column rather than adding ad hoc tables.
