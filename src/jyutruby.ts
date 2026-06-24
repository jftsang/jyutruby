import {AppMode, AppState, defaultInitialState} from "./state";
import {loadFromStorage, stateSaver} from "./storage";
import editingView from "./editingView";
import readerView from "./readerView";

// @ts-ignore
import {app, h, text} from "hyperapp";
import reviewView from "./reviewView";
import flashcardView from "./flashcardView";
import {actions as flashcardActions} from "./flashcardView";

const initialState: AppState = {
    ...defaultInitialState,
    ...(loadFromStorage() ?? {})
};

const actions = {
    setAppMode: (state: AppState, newMode: AppMode): AppState => {
        return {...state, appMode: newMode};
    },
};

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}


function modeChooser(state: AppState) {
    const options = [
        [AppMode.reading, 'read'],
        [AppMode.editing, 'edit'],
        [AppMode.review, 'review'],
        [AppMode.flashcard, 'flashcards'],
    ]
    const tabs = [];
    for (const [mode, label] of options) {
        const tab = h(
            'a',
            {
                href: '#',
                onclick: [actions.setAppMode, mode],
                class: 'nav-link' + (state.appMode === mode ? ' active' : '')
            },
            [text(label)]
        )
        tabs.push(tab)
    }
    return h('nav', {
        id: 'modeChooser',
        class: 'nav nav-tabs justify-content-center'
    }, tabs)
}


function view(state: AppState) {
    let body;
    switch (state.appMode) {
        case AppMode.reading:
            body = readerView(state);
            break;
        case AppMode.editing:
            body = editingView(state);
            break;
        case AppMode.review:
            body = reviewView(state);
            break;
        case AppMode.flashcard:
            body = flashcardView(state);
            break;
        default:
            throw new Error('Unknown app mode');
    }

    return h('div', {}, [modeChooser(state), body]);
}


app({
    node: document.getElementById('app'),
    view: view,
    init: initialState,
    subscriptions: (state: AppState) => [
        [
            (dispatch, props) => {
                const handleKeydown = (e) => {
                    if (e.key === 'q' || e.key === 'Q') dispatch((state) => actions.setAppMode(state, AppMode.reading));
                    if (e.key === 'w' || e.key === 'W') dispatch((state) => actions.setAppMode(state, AppMode.editing));
                    if (e.key === 'e' || e.key === 'E') dispatch((state) => actions.setAppMode(state, AppMode.review));
                    if (e.key === 'r' || e.key === 'R') dispatch((state) => actions.setAppMode(state, AppMode.flashcard));

                    if (state.appMode === AppMode.flashcard) {
                        if (e.key === 'f' || e.key === 'F') dispatch(flashcardActions.flip);
                        if (e.key === 'n' || e.key === 'N') dispatch(flashcardActions.next);
                    }
                };
                window.addEventListener('keydown', handleKeydown);
                return () => window.removeEventListener('keydown', handleKeydown);
            },
            {}
        ]
    ]
});
