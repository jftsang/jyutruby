import {AppMode, AppState, defaultInitialState} from "./state";
import {loadFromStorage, stateSaver} from "./storage";
import editingView from "./editingView";
import annotationView from "./annotationView";

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
    const viewButton = h(
        'a',
        {
            href: '#',
            onclick: [actions.setAppMode, AppMode.annotation],
            class: 'nav-link' + (state.appMode === AppMode.annotation ? ' active' : '')
        },
        [text('view')]
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
    }, [viewButton, editButton, reviewButton])
}


function view(state: AppState) {
    let body;
    switch (state.appMode) {
        case AppMode.annotation:
            body = annotationView(state);
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
