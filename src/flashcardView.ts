import {h, text} from "hyperapp";
import {AppState} from "./state.js";
import {mdbgUrl, toJyutping} from "./chinese.js";

export interface FlashcardState {
    currentCharacter: string;
    flipped: boolean;
}

function getRandomItem<S>(set: Set<S>, exclude: S | null = null): S | null {
    if (set.size === 0) {
        return null;
    }
    if (set.size === 1 && exclude !== null && set.has(exclude)) {
        return exclude;
    }
    let items = Array.from(set).filter(item => item !== exclude);
    if (items.length === 0) {
        return null;
    }
    return items[Math.floor(Math.random() * items.length)];
}

export const actions = {
    flip: (state: AppState): AppState => {
        state.flashcardState.flipped = !state.flashcardState.flipped;
        return {...state}
    },
    next: (state: AppState): AppState => {
        state.flashcardState.flipped = false;
        const nextChar = getRandomItem(
          state.savedCharacters, state.flashcardState.currentCharacter
        );
        if (nextChar !== null) {
          state.flashcardState.currentCharacter = nextChar;
        }
        return {...state}
    },
    drop: (state: AppState): AppState => {
      const cur = state.flashcardState.currentCharacter;
      if (cur && state.savedCharacters.has(cur))
        state.savedCharacters.delete(cur);

      return actions.next(state);
    },
}

export default function flashcardView(state: AppState) {
    const fsstate = state.flashcardState;

    if (fsstate.currentCharacter === null)
        fsstate.currentCharacter = getRandomItem(state.savedCharacters);

    if (state.savedCharacters.size === 0) {
        return h('div', {class: 'text-center mt-5'}, [
            text('No saved characters. Go to the reading mode and click on characters to save them.')
        ]);
    }

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
            style: {'fontSize': '8rem'}
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
    buttons.push(
        h('button', {
            class: 'btn btn-warning w-25 mx-auto',
            onclick: actions.drop
        }, [text('drop')]),
    )
    const buttonsContainer = h('div', {
        id: 'opts',
        class: 'opts row justify-content-center w-50 mx-auto my-4'
    }, buttons)

    return h('div',
        {},
        [flashcard, buttonsContainer]
    )

}
