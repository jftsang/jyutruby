from contextlib import asynccontextmanager
from pathlib import Path

import fastapi
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from starlette.templating import Jinja2Templates

from backend.auth import _get_current_user_id, router as auth_router

templates = Jinja2Templates(directory=Path(__file__).parent / "templates")


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    yield


app = fastapi.FastAPI(lifespan=lifespan)

app.include_router(auth_router)


@app.get("/signup")
def signup_page(request: Request):
    from backend.db import get_db, User

    db = next(get_db())
    user_id = _get_current_user_id(request)
    current_user = db.get(User, user_id) if user_id else None
    return templates.TemplateResponse(
        request, "signup.html", {"current_user": current_user}
    )


@app.get("/login")
def login_page(request: Request):
    from backend.db import get_db, User

    db = next(get_db())
    user_id = _get_current_user_id(request)
    current_user = db.get(User, user_id) if user_id else None
    return templates.TemplateResponse(
        request, "login.html", {"current_user": current_user}
    )


@app.get("/api/hello")
def hello():
    return {"message": "hello from backend"}


app.mount(
    "/",
    StaticFiles(directory=Path(__file__).parent / "../dist", html=True),
    name="static",
)
