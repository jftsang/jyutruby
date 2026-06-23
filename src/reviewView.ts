import {toJyutping, toJyutpingArray} from "./chinese.js";
import {AppState} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";
import {stateSaver} from "./storage";

const actions = {
    addNewSavedCharacter: (state: AppState, char: string): AppState => {
        const savedCharacters = new Set(state.savedCharacters);
        savedCharacters.add(char);
        return {...state, savedCharacters};
    },
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
    const ctr = {class: 'text-center'}
    rows.push(
        h('thead', {}, [
            h('tr', {}, [
                h('th', ctr, [text('character')]),
                h('th', ctr, [text('main reading')]),
                h('th', ctr, [text('alternative readings')]),
                h('th', ctr, [text('definition on mdbg')]),
                h('th', ctr, [text('remove')])
            ])
        ])
    )
    for (const char of state.savedCharacters) {
        const mainReading = toJyutping(char) ?? '';

        const allReadings: string[] = toJyutpingArray(char);
        const alternativeReadings = allReadings !== null && allReadings.length > 1 ? allReadings.slice(1).toString().replaceAll(',', ', ') : '';

        const row = h('tr', {class: ''}, [
          h('td', {class: 'text-center chinese revisionChinese'}, [text(char)]),
          h('td', ctr, [text(mainReading)]),
          h('td', ctr, [text(alternativeReadings)]),
          h('td', ctr, [
            h('a', {
              class: 'link',
              href: `https://www.mdbg.net/chinese/dictionary?page=chardict&cdqchi=${char}`,
              target: '_blank',
            }, [text('definition')])
          ]),
          h('td', {
            class: 'clickable text-center',
            onclick: [actions.removeSavedCharacter, char]
          }, [
            h('a', {href: '#'}, [
              h('i', {class: "bi bi-x"})
            ])
          ])
        ]);
        rows.push(row);
    }

    const addNewCharInput = h('input', {
        type: 'text',
        class: 'form-control text-center chinese revisionChinese bg-white',
        maxlength: '1',
    })
    const addCharRow = h('tr', {}, [
      h('td', {class: 'text-center chinese revisionChinese'}, [
        addNewCharInput
      ]),
      h('td', {}),
      h('td', {}),
      h('td', {}),
      h('td', {class: 'text-center'}, [
        h('button', {
          class: 'btn btn-success',
          onclick: (state) => actions.addNewSavedCharacter(state, addNewCharInput.node.value)
        }, [text('Add')])
      ])
    ])
    rows.push(addCharRow);

    const table = h('table',
        {class: 'table'},
        rows
    );


    const clearAllButton = h('div', {class: 'row justify-content-end'}, [
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
