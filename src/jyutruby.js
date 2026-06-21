import {h, app, text} from "hyperapp";
import {defaultText} from "./defaulttext.js";
import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";

const initialState = {
  inputText: defaultText, annotatedCharacters: new Set(), showingAll: false,
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
  }, hideAll: (state) => {
    return {...state, annotatedCharacters: new Set(), showingAll: false};
  },
};

const displayCharacter = (char, isVisible) => {
  if (char === '\n') {
    return h('br', {class: ''}, []);
  }
  const jyut = toJyut(char);
  if (!jyut) {
    return text(char);
  }
  return h('ruby', {
    class: 'clickable', onclick: [actions.toggleRuby, char]
  }, [text(char), h('rt', {
    class: isVisible ? 'visible' : ''
  }, [text(jyut)]),]);
};

function view(state) {
  const showAllLabel = state.showingAll ? 'Don\'t show all' : 'Show all'
  const showAll = h('button', {onclick: actions.toggleShowAll}, [text(showAllLabel)]);
  const hideAll = h('button', {onclick: actions.hideAll}, [text('Hide all')]);
  const topBar = h('div', {
    class: 'topbar',
  }, [showAll, hideAll])

  const annotatedDisplay = h('div', {id: 'annotated'},
    Array(...state.inputText).map(char => displayCharacter(char, state.annotatedCharacters.has(char) || state.showingAll))
  );
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
