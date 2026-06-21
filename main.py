import string
from functools import cache

import pycantonese
import uvicorn
from fastapi import FastAPI
from pypinyin import Style, pinyin
from streamerate import stream

app = FastAPI()
app.frontend("/", directory="frontend/dist/")


@cache
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


@cache
def character_to_pinyin(character: str) -> tuple[str, str]:
    """Wrapper around pypinyin that processes a single character,
    and is guaranteed to return a value even for non-Chinese characters
    as well as special characters like \n.
    """

    # Avoid silly edge cases like the English character `e` or Arabic
    # numerals like `2` being interpreted and pinyinised.
    if character in string.printable:
        return (character, "")


    charpin = pinyin(character, style=Style.TONE, heteronym=False)
    if not charpin or not charpin[0]:  # empty list, for \n and other special characters
        return (character, "")

    pin = charpin[0][0]
    if pin is None:  # e.g. for punctuation and Latin characters
        pin = ""

    return character, pin


def chinese_to_jyutping(chinese: str) -> list[tuple[str, str | None]]:
    return stream(chinese).map(character_to_jyutping).to_list()

def chinese_to_pinyin(chinese: str) -> list[tuple[str, str | None]]:
    """Returns list of possible pinyin readings for a single character."""
    return stream(chinese).map(character_to_pinyin).to_list()


@app.get("/jyutping")
async def jyutping_api(chinese: str) -> list[tuple[str, str | None]]:
    return chinese_to_jyutping(chinese)


@app.get("/pinyin")
async def pinyin_api(chinese: str) -> list[tuple[str, str | None]]:
    return chinese_to_pinyin(chinese)


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
