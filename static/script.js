import {h, app} from "./hyperapp.js";

const initialState = {
  inputText: `人之初，性本善，性相近，習相遠；
苟不教，性乃遷，教之道，貴以專。  Hello, world.
昔孟母，擇鄰處，子不學，斷機杼；
竇燕山，有義方，教五子，名俱揚。
養不教，父之過；教不嚴，師之惰。 Inserting 2 sentences of English text & punctuation.
    This is to test whether these are interpolated correctly.
子不學，非所宜；幼不學，老何為？
玉不琢，不成器；人不學，不知理；
為人子，方少時，親師友，習禮儀。
香九齡，能溫席，孝於親，所當執；
融四歲，能讓梨，悌於長，宜先知。`,
  annotatedData: [],
  visibleRubies: new Set()
};

const actions = {
  setInputText: (state, event) => ({...state, inputText: event.target.value}),
  setAnnotatedData: (state, data) => ({
    ...state,
    annotatedData: data,
    visibleRubies: new Set()
  }),
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
  hideAll: (state) => ({...state, visibleRubies: new Set()}),
  submit: async (state) => {
    const query = encodeURIComponent(state.inputText);
    const response = await fetch("/jyutping?chinese=" + query);
    const data = await response.json();
    return actions.setAnnotatedData(state, data);
  }
};

const displayWithRuby = (char, jyut, index, isVisible) => {
  if (char === '\n') {
    return h('br');
  }
  if (jyut) {
    return h('ruby', {
      class: 'clickable',
      onclick: ['toggleRuby', index]
    }, [
      h('rt', {
        class: isVisible ? 'visible' : ''
      }, jyut),
      char
    ]);
  }
  return char;
};

function view(state) {
  const showAll = h('button', {onclick: 'showAll'}, 'Show all');
  const hideAll = h('button', {onclick: 'hideAll'}, 'Hide all');

  const inputForm = h('div', {style: {padding: "50px", height: "40%"}}, [
      h('textarea', {
        id: 'chinesetext',
        name: 'chinesetext',
        placeholder: 'Enter Chinese text...',
        oninput: ['setInputText']
      }, state.inputText),
      h('div', {style: {display: "flex"}}, [
        h('button', {
          id: 'submit',
          name: 'submit',
          style: {width: "100%"},
          onclick: 'submit'
        }, 'Submit')
      ])
    ]);

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
