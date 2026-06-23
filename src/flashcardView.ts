import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";

function getRandomItem<S>(set: Set<S>): S {
    let items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

const actions = {
    flip: (state: AppState): AppState => {
        alert('sorry, flashcards don\'t work yet')
        return state
    },
    next: (state: AppState): AppState => {
        alert('sorry, flashcards don\'t work yet')
        return state
    },

}

export default function flashcardView(state: AppState) {
    const chosen = getRandomItem(state.savedCharacters);
    const flipped = false;
    const flashcard = h('div', {
        id: 'flashcard',
        class: 'flashcard chinese'
    }, text(chosen))
    const moves = []
    moves.push(
        h('button', {class: 'btn btn-primary w-25 mx-auto', onclick: actions.flip}, [text('flip')]),
    )
    moves.push(
        h('button', {class: 'btn btn-primary w-25 mx-auto', onclick: actions.next}, [text('next')]),
    )
    const optsContainer = h('div', {
        id: 'opts',
        class: 'opts row justify-content-center w-25 mx-auto'
    }, moves)

    return h('div',
        {},
        [flashcard, optsContainer])

}
