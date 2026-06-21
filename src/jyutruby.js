import {h, app, text} from "hyperapp";
import {defaultText} from "./defaulttext.js";
import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";

const initialState = {
  inputText: defaultText,
  annotatedData: [],
  visibleRubies: new Set()
};

function toJyut(char) {
  if (Object.hasOwn(cantojpmin_data, char))
    return CantoJpMin.toJyutping(char);
  return null;
}

const fetchEffect = async (dispatch, {text}) => {
  const data = Array(...text).map((c) => [c, toJyut(c)])
  return await dispatch(actions.setAnnotatedData, data);
};


const actions = {
  setInputText: (state, event) => {
    return {...state, inputText: event.target.value};
  },
  setAnnotatedData: (state, data) => {
    return {
      ...state,
      annotatedData: data,
      visibleRubies: new Set()
    };
  },
  toggleRuby: (state, index) => {
    const newVisible = new Set(state.visibleRubies);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    return {...state, visibleRubies: newVisible};
  },
  showAll: (state) => {
    const allIndices = state.annotatedData
      .map((_, i) => i)
      .filter(i => state.annotatedData[i][1]);
    return {...state, visibleRubies: new Set(allIndices)};
  },
  hideAll: (state) => {
    return {...state, visibleRubies: new Set()};
  },
  submit: (state) => {
    return [
      state,
      [fetchEffect, {text: state.inputText}]
    ];
  },
};

const displayWithRuby = (char, jyut, index, isVisible) => {
  if (char === '\n') {
    return h('br', {class: ''}, []);
  }
  if (jyut) {
    return h('ruby', {
      class: 'clickable',
      onclick: [actions.toggleRuby, index]
    }, [
      text(char),
      h('rt', {
          class: isVisible ? 'visible' : ''
        },
        [text(jyut)]
      ),
    ]);
  }
  return text(char);
};

function view(state) {
  const showAll = h('button', {onclick: actions.showAll}, [text('Show all')]);
  const hideAll = h('button', {onclick: actions.hideAll}, [text('Hide all')]);

  const inputForm = h('div', {style: {padding: "50px", height: "40%"}}, [
    h('textarea', {
        id: 'chinesetext',
        name: 'chinesetext',
        placeholder: 'Enter Chinese text...',
        oninput: actions.setInputText,
      },
      [text(state.inputText)]
    ),
    h('div', {style: {display: "flex"}}, [
        h('button', {
            id: 'submit',
            name: 'submit',
            style: {width: "100%"},
            onclick: actions.submit
          },
          [text('Submit')]
        )
      ]
    )
  ])

  return h('div', {}, [
    h('div', {style: {display: "flex", gap: "10px", marginBottom: "20px",}}, [
      showAll, hideAll
    ]),
    h('div', {id: 'annotated'},
      state.annotatedData.map(([char, jyut], index) =>
        displayWithRuby(char, jyut, index, state.visibleRubies.has(index))
      )
    ),
    inputForm,
  ]);
}


app({
  node: document.getElementById('app'),
  view: view,
  subscriptions: (state) => [],
  init: initialState
});
