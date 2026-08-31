from contextlib import asynccontextmanager
from pathlib import Path

import fastapi
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from backend.auth import router as auth_router
from backend.db import init_db
from backend.pages import LOGIN_PAGE, SIGNUP_PAGE


@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    init_db()
    yield


app = fastapi.FastAPI(lifespan=lifespan)

app.include_router(auth_router)


@app.get("/signup", response_class=HTMLResponse)
def signup_page():
    return SIGNUP_PAGE


@app.get("/login", response_class=HTMLResponse)
def login_page():
    return LOGIN_PAGE


@app.get("/api/hello")
def hello():
    return {"message": "hello from backend"}


app.mount(
    "/", StaticFiles(directory=Path(__file__).parent / "../dist", html=True), name="static"
)
