import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";

const actions = {
    setInputText: (state: AppState, event: InputEvent): AppState => {
        // @ts-ignore
        return {...state, inputText: event.target.value};
    },
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
