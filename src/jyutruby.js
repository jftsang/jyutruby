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
    {onclick: actions.toggleEditing},
    [text(state.editing ? 'view' : 'edit')]
  )  // FIXME this should show 'view' when in edit mode


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
    const showAllLabel = h('label', {'for': 'showAllToggle'}, [text('Show all')]);
    const showAll = h('input', {
      id: 'showAllToggle',
      type: 'checkbox',
      role: 'switch',
      checked: state.showingAll,
      onclick: actions.toggleShowAll
    }, [text(showAllLabel)]);

    const preserveLinesLabel = h('label', {'for': 'preserveLinesToggle'}, [text('Preserve lines')]);
    const preserveLines = h('input', {
      id: 'preserveLinesToggle',
      type: 'checkbox',
      role: 'switch',
      checked: state.preservingLines,
      onclick: actions.togglePreservingLines
    }, []);
    const hideAll = h('button', {onclick: actions.hideAll}, [text('Hide all')]);
    const annotatedDisplay = h('div', {
      id: 'annotated',
      class: 'chinese'
    }, Array(...state.inputText).map(char => displayCharacter(char, state)));
    body = h('div', {
      class: 'topbar',
    }, [showAll, showAllLabel, hideAll, preserveLines, preserveLinesLabel, annotatedDisplay])
  }

  return h('div', {}, [editButton, body]);
}


app({
  node: document.getElementById('app'),
  view: view,
  subscriptions: (state) => [],
  init: initialState,
});
