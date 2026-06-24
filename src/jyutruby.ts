import {AppMode, AppState, defaultInitialState} from "./state.js";
import {loadFromStorage, stateSaver} from "./storage.js";
import editingView from "./editingView.js";
import readerView from "./readerView.js";

import {app, h, text} from "hyperapp";
import reviewView from "./reviewView.js";
import flashcardView, {actions as flashcardActions} from "./flashcardView.js";

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
    const options: [AppMode, string][] = [
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
          const modeShortcuts: [string, AppMode][] = [
            ['q', AppMode.reading],
            ['w', AppMode.editing],
            ['e', AppMode.review],
            ['r', AppMode.flashcard],
          ]
          for (const [k, newMode] of modeShortcuts) {
            if (e.key === k) dispatch((state) => actions.setAppMode(state, newMode));
          }

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
