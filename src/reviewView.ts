import {toJyutping, toJyutpingArray} from "./chinese.js";
import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";
import {stateSaver} from "./storage";

const actions = {
    removeSavedCharacter: (state: AppState, char: string): AppState => {
        const savedCharacters = new Set(state.savedCharacters);
        savedCharacters.delete(char);
        return {...state, savedCharacters};
    },
    removeAllSavedCharacters: (state: AppState): AppState => {
        if (confirm('Are you sure you want to clear all saved characters?')) {
            return {...state, savedCharacters: new Set()};
        } else {
            return state
        }
    }
}

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}

export default function reviewView(state: AppState) {

    if (state.savedCharacters.size === 0) {
        return h('div', {class: 'container'}, [text('No saved characters. Click on some characters to save them.')]);
    }

    const rows = [];
    for (const char of state.savedCharacters) {
        const readings: string[] = toJyutpingArray(char);
        const mainReading = toJyutping(char);
        if (!mainReading) continue;  // shouldn't happen but just in case


        const row = h('tr', {class: ''}, [
            h('td', {class: 'chinese revisionChinese'}, [text(char)]),
            h('td', {}, [text(mainReading)]),
            h('td', {}, [text(readings.toString().replaceAll(',', ', '))]),
            h('td', {}, [
               h('a', {
                   class: 'link',
                   href: `https://www.mdbg.net/chinese/dictionary?page=chardict&cdqchi=${char}`
               }, [text('definition')])
            ]),
            h('td', {
                class: 'clickable',
                onclick: [actions.removeSavedCharacter, char]
            }, [h('i', {class: "bi bi-x"})])
        ]);
        rows.push(row);
    }
    const table = h('table',
        {class: 'table'},
        rows
    );


    const clearAllButton =  h('div', {class: 'row justify-content-end'}, [
                h('div', {class: 'col-md-3'}, [
                    h('button', {
                        class: 'btn btn-danger w-100',
                        onclick: actions.removeAllSavedCharacters,
                    }, [text('clear all')])
                ])
            ]);

    return h('div', {class: 'container'}, [
        h('div', {class: 'row justify-content-center'}, [
            h('div', {class: 'col-md-8'}, [table])
        ]),

        clearAllButton,
    ])
}
