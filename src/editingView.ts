import {AppState} from "./state.js";
// @ts-ignore
import {h, text} from "hyperapp";
import {stateSaver} from "./storage.js";

const actions = {
  setInputText: (state: AppState, event: InputEvent): AppState => {
    return {
      ...state,
      inputText: (event.target as HTMLTextAreaElement).value,
    };
  },
}

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}

export default function editingView(state: AppState) {
    const editBody = h('div', {style: {padding: "50px", height: "40%"}}, [h('textarea', {
        id: 'chineseInput',
        name: 'chineseInput',
        class: 'chinese',
        placeholder: 'Enter Chinese text...',
        oninput: actions.setInputText,
    }, [text(state.inputText)]),])

    return h('div', {class: 'edit'}, [editBody])
}
