import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";
import {mdbgUrl, toJyutping} from "./chinese";

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

export const actions = {
    flip: (state: AppState): AppState => {
        state.flashcardState.flipped = !state.flashcardState.flipped;
        return {...state}
    },
    next: (state: AppState): AppState => {
        state.flashcardState.flipped = false;
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
        class: 'flashcard chinese text-center flashcard-face flashcard-front',
        key: fsstate.currentCharacter + '-front'
    }, text(fsstate.currentCharacter))
    const backSide = h('div', {
        id: 'flashcardBack',
        class: 'flashcard text-center flashcard-face flashcard-back',
        key: fsstate.currentCharacter + '-back'
    }, [
        h('div', {},
        h('span', {
            class: 'chinese',
            style: {'font-size': '8rem'}
        }, text(toJyutping(fsstate.currentCharacter))),
        ),
        h('a', {
            class: 'link',
            href: mdbgUrl(fsstate.currentCharacter),
            target: '_blank',
        }, [text('definition')])
    ])

    const flashcard = h('div', {
        id: 'flashcard',
        class: [
            'flashcard',
            'row', 'justify-content-center', 'w-100', 'mx-auto', 'mb-5',
            (fsstate.flipped ? ' flipped' : '')
        ],
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
        class: 'opts row justify-content-center w-100 mx-auto my-4'
    }, buttons)

    return h('div',
        {},
        [flashcard, buttonsContainer]
    )

}
