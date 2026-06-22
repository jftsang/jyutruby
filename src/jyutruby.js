import {h, app, text} from "hyperapp";
import {defaultText} from "./defaulttext.js";
import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";

const initialState = {
  inputText: defaultText,
  annotatedCharacters: new Set(),
  showingAll: false,
  preservingLines: true,
};

function toJyut(char) {
  if (Object.hasOwn(cantojpmin_data, char)) return CantoJpMin.toJyutping(char);
  return null;
}

const actions = {
  setInputText: (state, event) => {
    return {...state, inputText: event.target.value};
  }, toggleRuby: (state, char) => {
    const annotatedCharacters = new Set(state.annotatedCharacters);
    if (annotatedCharacters.has(char)) {
      annotatedCharacters.delete(char);
    } else {
      annotatedCharacters.add(char);
    }
    return {...state, annotatedCharacters: annotatedCharacters};
  }, toggleShowAll: (state) => {
    return {...state, showingAll: !state.showingAll};
  }, togglePreservingLines: (state) => {
    return {...state, preservingLines: !state.preservingLines};
  }, hideAll: (state) => {
    return {...state, annotatedCharacters: new Set(), showingAll: false};
  },
};

const displayCharacter = (char, state) => {
  if (char === '\n') {
    if (!state.preservingLines) return;
    return h('br', {class: ''}, []);
  }
  const isVisible = state.annotatedCharacters.has(char) || state.showingAll
  const jyut = toJyut(char);
  if (!jyut) {
    return text(char);
  }
  const rt = h('rt', {class: isVisible ? 'visible' : ''}, [text(jyut)])
  return h('ruby', {
    class: 'clickable', onclick: [actions.toggleRuby, char]
  }, [rt, text(char)]);
};

function view(state) {
  const showAllLabel = h('label', {'for': 'showAllToggle'}, [text('Show all')]);
  const showAll = h('input', {
    id: 'showAllToggle',
    type: 'checkbox',
    checked: state.showingAll,
    onclick: actions.toggleShowAll
  }, [text(showAllLabel)]);

  const preserveLinesLabel = h('label', {'for': 'preserveLinesToggle'}, [text('Preserve lines')]);
  const preserveLines = h('input', {
    id: 'preserveLinesToggle',
    type: 'checkbox',
    checked: state.preservingLines,
    onclick: actions.togglePreservingLines
  }, []);
  const hideAll = h('button', {onclick: actions.hideAll}, [text('Hide all')]);
  const topBar = h('div', {
    class: 'topbar',
  }, [showAll, showAllLabel, hideAll, preserveLines, preserveLinesLabel])

  const annotatedDisplay = h('div', {id: 'annotated'}, Array(...state.inputText).map(char => displayCharacter(char, state)));
  const inputForm = h('div', {style: {padding: "50px", height: "40%"}}, [h('textarea', {
    id: 'chinesetext',
    name: 'chinesetext',
    placeholder: 'Enter Chinese text...',
    oninput: actions.setInputText,
  }, [text(state.inputText)]),])

  return h('div', {}, [topBar, annotatedDisplay, inputForm,]);
}


app({
  node: document.getElementById('app'),
  view: view,
  subscriptions: (state) => [],
  init: initialState,
});
