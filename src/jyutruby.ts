import {AppMode, AppState, User, defaultInitialState} from "./state.js";
import {loadFromStorage, stateSaver} from "./storage.js";
import editingView from "./editingView.js";
import readerView from "./readerView.js";

import {app, h, text, VNode} from "hyperapp";
import reviewView from "./reviewView.js";
import flashcardView, {actions as flashcardActions} from "./flashcardView.js";

const initialState: AppState = {
    ...defaultInitialState,
    ...(loadFromStorage() ?? {})
};

type Action = (state: AppState, ...args: any[]) => AppState;


const actions: Record<string, Action> = {
  setAppMode: (state: AppState, newMode: AppMode): AppState => {
    return {...state, appMode: newMode};
  },
  resetAppState: (state: AppState): AppState => {
    if (!confirm('Are you sure you want to reset the app?')) {
      return state;
    }

    return defaultInitialState;
  },
  setUser: (state: AppState, user: User | null): AppState => {
    return {...state, user, authAvailable: true};
  },
  setAuthUnavailable: (state: AppState): AppState => {
    return {...state, user: null, authAvailable: false};
  },
  logout: (state: AppState): AppState => {
    fetch("/api/auth/logout", {method: "POST"})
      .then(() => dispatchRef(actions.setUser, null));
    return {...state, user: null};
  }
};

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}

let dispatchRef: (action: Action, ...args: any[]) => void = () => {};

function fetchAuthUser(): void {
  fetch("/api/auth/me", {credentials: "same-origin"})
    .then(r => {
      if (r.ok) return r.json();
      if (r.status === 401) return null;
      throw new Error('Auth API error');
    })
    .then((data: User | null) => dispatchRef(actions.setUser, data))
    .catch(() => dispatchRef(actions.setAuthUnavailable));
}

function authMenu(state: AppState) {
  if (!state.authAvailable) {
    return [];
  }
  if (state.user) {
    return [
      text(`hello, ${state.user.display_name}`),
      h('span', {class: 'mx-2'}, []),
      h('a', {href: '#', onclick: actions.logout}, [text('log out')]),
    ];
  }
  return [
    h('a', {class: 'mx-1', href: '/login'}, [text('login')]),
    h('a', {class: 'mx-1', href: '/signup'}, [text('signup')]),
  ];
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
    const auth = state.authAvailable
      ? h('div', {id: 'authMenu', class: 'ms-auto'}, authMenu(state))
      : null;
    const children = auth ? [...tabs, auth] : tabs;

    return h('nav', {
        id: 'modeChooser',
        class: 'nav nav-tabs justify-content-center'
    }, children)
}

function footer(state: AppState) {
    const links: VNode<any>[] = [
      text('Jyutruby'),
      h('span', {class: 'mx-2'}, []),
      h('a', {href: 'https://github.com/jftsang/jyutruby'},
        [text('github')]
      ),
      h('span', {class: 'mx-2'}, []),
      h('a', {href: '#', onclick: actions.resetAppState, class: 'text-danger'}, [
        text('reset everything')
      ]),
      h('span', {class: 'mx-2'}, []),
      h('a', {href: '#'}, [text('back to top')]),
    ];

  return h(
      'footer', {}, [
        h('div', {id: 'bottombar', class: 'bottombar text-center'}, links)
      ]
    );
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

    return h('div', {style: {display: 'flex', flexDirection: 'column', minHeight: '100vh'}}, [
      modeChooser(state),
      h('div', {style: {flex: '1'}}, [body]),
      footer(state),
    ]);
}

fetchAuthUser();

app({
  node: document.getElementById('app') as HTMLElement,
  view: view,
  init: initialState,
  subscriptions: (state: AppState) => [
    [
      (dispatch, props) => {
        dispatchRef = dispatch;
        const handleKeydown = (e) => {
          // Don't trigger shortcuts when typing in input/textarea
          if (
            e.target instanceof HTMLTextAreaElement ||
            e.target instanceof HTMLInputElement ||
            e.target.isContentEditable
          ) {
            return; // Do not process the shortcut
          }

          const modeShortcuts: [string, AppMode][] = [
            ['q', AppMode.reading],
            ['w', AppMode.editing],
            ['e', AppMode.review],
            ['r', AppMode.flashcard],
          ]
          for (const [k, newMode] of modeShortcuts) {
            if (e.key === k) dispatch((state: AppState) => actions.setAppMode(state, newMode));
          }

          if (state.appMode === AppMode.flashcard) {
            if (e.key === 'f') dispatch(flashcardActions.flip);
            if (e.key === 'n') dispatch(flashcardActions.next);
            if (e.key === 'N') dispatch(flashcardActions.drop);
          }
        };
        window.addEventListener('keydown', handleKeydown);

        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            fetchAuthUser();
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleVisibility);

        return () => {
          window.removeEventListener('keydown', handleKeydown);
          document.removeEventListener('visibilitychange', handleVisibility);
          window.removeEventListener('focus', handleVisibility);
        };
      },
      {}
    ]
  ]
});
