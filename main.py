import string
from operator import itemgetter

import pycantonese
import uvicorn
from fastapi import FastAPI, Request, Response
from starlette.responses import HTMLResponse
from starlette.templating import Jinja2Templates
from streamerate import stream


app = FastAPI()
templates = Jinja2Templates(directory="templates")


def character_to_jyutping(character: str) -> tuple[str, str]:
    """Wrapper around pycantonese.character_to_jyutping that processes
    a single character, and is guaranteed to return a value even for
    non-Chinese characters as well as special characters like \n.
    """

    # Avoid silly edge cases like the English character `e` or Arabic
    # numerals like `2` being interpreted and jyutpingised.
    if character in string.printable:
        return (character, "")

    charjyut: list[tuple[str, str | None]] = pycantonese.characters_to_jyutping(
        character
    )
    # TODO handle characters with multiple readings?
    # assert len(charjyut) in {0, 1}

    if not charjyut:  # empty list, for \n and other special characters
        return (character, "")

    _, jyut = charjyut[0]
    if jyut is None:  # e.g. for punctuation and Latin characters
        jyut = ""

    return character, jyut


def chinese_to_jyutping(chinese: str) -> list[tuple[str, str | None]]:
    """Returns list of possible jyutping readings for a single character."""
    return stream(chinese).map(character_to_jyutping).to_list()


@app.get("/transcribe")
async def transcribe(chinese: str) -> list[tuple[str, str | None]]:
    return chinese_to_jyutping(chinese)


@app.get("/")
async def root(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "index.html", context={})


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
