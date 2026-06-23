import {AppMode, AppState, defaultInitialState} from "./state";
import {loadFromStorage, stateSaver} from "./storage";
import editingView from "./editingView";
import readerView from "./readerView";

// @ts-ignore
import {app, h, text} from "hyperapp";
import reviewView from "./reviewView";

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
    const readButton = h(
        'a',
        {
            href: '#',
            onclick: [actions.setAppMode, AppMode.reading],
            class: 'nav-link' + (state.appMode === AppMode.reading ? ' active' : '')
        },
        [text('read')]
    )
    const editButton = h(
        'a',
        {
            href: '#',
            onclick: [actions.setAppMode, AppMode.editing],
            class: 'nav-link' + (state.appMode === AppMode.editing ? ' active' : '')
        },
        [text('edit')]
    )
    const reviewButton = h(
        'a',
        {
            href: '#',
            onclick: [actions.setAppMode, AppMode.review],
            class: 'nav-link' + (state.appMode === AppMode.review ? ' active' : '')
        },
        [text('review')]
    )
    return h('nav', {
        id: 'modeChooser',
        class: 'nav nav-tabs justify-content-center'
    }, [readButton, editButton, reviewButton])
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
        default:
            throw new Error('Unknown app mode');
    }

    return h('div', {}, [modeChooser(state), body]);
}


app({
    node: document.getElementById('app'),
    view: view,
    subscriptions: (state) => [],
    init: initialState,
});
