import {AppMode, AppState, defaultInitialState} from "./state";
import {loadFromStorage, stateSaver} from "./storage";
import editingView from "./editingView";
import annotationView from "./annotationView";

// @ts-ignore
import {app, h, text} from "hyperapp";

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
            onclick: [actions.setAppMode, AppMode.annotation],
            class: 'nav-link' + (state.appMode === AppMode.annotation ? ' active' : '')
        },
        [text('view')]
    )
    const editButton = h(
        'a',
        {
            onclick: [actions.setAppMode, AppMode.editing],
            class: 'nav-link' + (state.appMode === AppMode.editing ? ' active' : '')
        },
        [text('edit')]
    )
    return h('nav', {
        id: 'modeChooser',
        class: 'nav nav-tabs justify-content-center'
    }, [viewButton, editButton])
}


function view(state: AppState) {
    let body;
    if (state.appMode === AppMode.editing) {
        body = editingView(state);
    } else if (state.appMode === AppMode.annotation) {
        body = annotationView(state);
    } else {
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
