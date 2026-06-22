import {app, h, text} from "hyperapp";
import {defaultInitialState} from "./defaults.js";
import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";
import {loadFromStorage, stateSaver} from "./storage.js";


const initialState = {
  ...defaultInitialState,
  ...(loadFromStorage() ?? {})
};

function toJyutping(char) {
  return Object.hasOwn(cantojpmin_data, char) ? CantoJpMin.toJyutping(char) : null;
}

const actions = {
  setInputText: (state, event) => {
    return {...state, inputText: event.target.value};
  },
  toggleRuby: (state, event, char) => {
    event.preventDefault();

    // if holding down shift, replace annotations
    // otherwise just toggle this one
    const sticky = !event.shiftKey;

    const annotatedCharacters = new Set(state.annotatedCharacters);
    if (sticky) {
      if (annotatedCharacters.has(char)) {
        annotatedCharacters.delete(char);
      } else {
        annotatedCharacters.add(char);
      }
    } else {
      if (state.annotatedCharacters.has(char)) {
        annotatedCharacters.delete(char);
      } else {
        annotatedCharacters.clear()
        annotatedCharacters.add(char);
      }
    }

    return {...state, annotatedCharacters: annotatedCharacters};
  },
  toggleEditing: (state) => {
    return {...state, editing: !state.editing};
  },
  toggleShowAll: (state) => {
    return {...state, showingAll: !state.showingAll};
  },
  togglePreservingLines: (state) => {
    return {...state, preservingLines: !state.preservingLines};
  },
  hideAll: (state) => {
    return {...state, annotatedCharacters: new Set(), showingAll: false};
  },
};

for (const [key, value] of Object.entries(actions)) {
  actions[key] = stateSaver(value);
}

const displayCharacter = (char, state) => {
  if (char === '\n') {
    if (!state.preservingLines) return;
    return h('br', {class: ''}, []);
  }
  const isVisible = state.annotatedCharacters.has(char) || state.showingAll
  const jyut = toJyutping(char);
  if (!jyut) {
    return text(char);
  }
  const rt = h('rt', {class: isVisible ? 'visible' : ''}, [text(jyut)])
  return h('ruby', {
    class: 'clickable',
    onclick: (state, event) => actions.toggleRuby(state, event, char)
  }, [rt, text(char)]);
};

function view(state) {

  const editButton = h(
    'button',
    {onclick: actions.toggleEditing,
      class: 'btn btn-primary'
    },
    [text(state.editing ? 'view' : 'edit')]
  )


  let body;
  if (state.editing) {
    body = h('div', {style: {padding: "50px", height: "40%"}}, [h('textarea', {
      id: 'chineseInput',
      name: 'chineseInput',
      class: 'chinese',
      placeholder: 'Enter Chinese text...',
      oninput: actions.setInputText,
    }, [text(state.inputText)]),]);
  }
  else {
    const showAllInput = h('input', {
      id: 'showAllToggle',
      type: 'checkbox',
      role: 'switch',
      class: 'form-check-input',
      checked: state.showingAll,
      onclick: actions.toggleShowAll
    }, []);
    const showAllLabel = h('label', {
      'class': 'form-check-label',
      'for': 'showAllToggle'
    }, [text('Show all')]);
    const showAll = h('div',
      {class: 'form-check form-check-inline form-switch'},
      [showAllInput, showAllLabel]
    );

    const hideAll = h('button',
      {
        disabled: state.annotatedCharacters.size === 0 && !state.showingAll,
        onclick: actions.hideAll, class: 'btn btn-secondary'},
      [text('Hide all')]
    );

    const preserveLinesInput = h('input', {
      id: 'preserveLinesToggle',
      type: 'checkbox',
      role: 'switch',
      class: 'form-check-input',
      checked: state.preservingLines,
      onclick: actions.togglePreservingLines
    }, []);
    const preserveLinesLabel = h('label', {
      'class': 'form-check-label',
      'for': 'preserveLinesToggle'
    }, [text('Preserve lines')]);
    const preserveLines = h('div',
      {class: 'form-check form-check-inline form-switch'},
      [preserveLinesInput, preserveLinesLabel]
    );

    const annotatedDisplay = h('div', {
      id: 'annotated',
      class: 'chinese mx-0 mx-md-auto col-md-6'
    }, Array(...state.inputText).map(char => displayCharacter(char, state)));
    body = h('div', {
      class: 'topbar',
    }, [showAll, hideAll, preserveLines, annotatedDisplay])
  }

  return h('div', {}, [editButton, body]);
}


app({
  node: document.getElementById('app'),
  view: view,
  subscriptions: (state) => [],
  init: initialState,
});
