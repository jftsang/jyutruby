import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";
import {toJyutping} from "./chinese";

export interface FlashcardState {
    currentCharacter: string;
    flipped: boolean;
}

function getRandomItem<S>(set: Set<S>): S | null {
    if (set.size === 0) {
        return null;
    }
    let items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

const actions = {
    flip: (state: AppState): AppState => {
        state.flashcardState.flipped = !state.flashcardState.flipped;
        return {...state}
    },
    next: (state: AppState): AppState => {
        state.flashcardState.currentCharacter = getRandomItem(state.savedCharacters);
        return {...state}
    },
}

export default function flashcardView(state: AppState) {
    const fsstate = state.flashcardState;

    if (fsstate.currentCharacter === null)
        fsstate.currentCharacter = getRandomItem(state.savedCharacters);

    const frontSide = h('div', {
        id: 'flashcardFront',
        class: 'flashcard chinese text-center'
    }, text(fsstate.currentCharacter))
    const backSide = h('div', {
            id: 'flashcardBack',
            class: 'flashcard chinese text-center'
        }, text(toJyutping(fsstate.currentCharacter))
    )

    const flashcard = h('div', {
        id: 'flashcard',
        class: 'flashcard row justify-content-center w-100 mx-auto'
    }, [frontSide, backSide])

    const buttons = []
    buttons.push(
        h('button', {
            class: 'btn btn-primary w-25 mx-auto',
            onclick: actions.flip
        }, [text('flip')]),
    )
    buttons.push(
        h('button', {
            class: 'btn btn-primary w-25 mx-auto',
            onclick: actions.next
        }, [text('next')]),
    )
    const buttonsContainer = h('div', {
        id: 'opts',
        class: 'opts row justify-content-center w-100 mx-auto'
    }, buttons)

    return h('div',
        {},
        [flashcard, buttonsContainer]
    )

}
