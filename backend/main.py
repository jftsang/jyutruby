from pathlib import Path

import fastapi
from fastapi.staticfiles import StaticFiles

app = fastapi.FastAPI()


@app.get("/api/hello")
def hello():
    return {"message": "hello from backend"}


app.mount(
    "/", StaticFiles(directory=Path(__file__).parent / "../dist", html=True), name="static"
)
