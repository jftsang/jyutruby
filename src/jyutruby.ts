import {app, h, text} from "hyperapp"; // @ts-ignore
import {AppMode, AppState, defaultInitialState, DisplayMode, toggle} from "./state";
import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";
import {loadFromStorage, stateSaver} from "./storage";

const initialState: AppState = {
    ...defaultInitialState,
    ...(loadFromStorage() ?? {})
};

function toJyutping(char: string): string | null {
    if (Object.hasOwn(cantojpmin_data, char)) {
        // @ts-ignore
        return CantoJpMin.toJyutping(char);
    } else {
        return null;
    }
}

const actions = {
    setInputText: (state: AppState, event: InputEvent): AppState => {
        // @ts-ignore
        return {...state, inputText: event.target.value};
    },
    handleCharacterClick: (state: AppState, event: MouseEvent, char: string): AppState => {
        event.preventDefault();

        const savedCharacters = new Set(state.savedCharacters);

        toggle(savedCharacters, char)

        return {
            ...state,
            savedCharacters: savedCharacters
        }
    },
    setAppMode: (state: AppState, newMode: AppMode): AppState => {
        return {...state, appMode: newMode};
    },
    setDisplayMode: (state: AppState, newMode: DisplayMode): AppState => {
        return {...state, displayMode: newMode};
    },
    togglePreservingLines: (state: AppState): AppState => {
        return {...state, preservingLines: !state.preservingLines};
    },
};

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}

const displayCharacter = (char: string, state: AppState) => {
    if (char === '\n') {
        if (!state.preservingLines) return;
        return h('br', {class: ''}, []);
    }
    const isVisible = (
        (
            state.displayMode == DisplayMode.showingSaved
            && state.savedCharacters.has(char)
        ) || (state.displayMode == DisplayMode.showingAll)
    );
    const jyut = toJyutping(char);
    if (!jyut) {
        return text(char);
    }
    const rt = h('rt', {class: isVisible ? 'visible' : ''}, [text(jyut)])
    const classList = ['clickable'];
    if (state.savedCharacters.has(char))
        classList.push('highlighted');
    return h('ruby', {
        class: classList,
        title: jyut,
        onclick: (state: AppState, event: MouseEvent): AppState => actions.handleCharacterClick(state, event, char)
    }, [rt, text(char)]);
};

function modeChooser(state: AppState) {
    const viewButton = h(
        'a',
        {
            onclick: [actions.setAppMode, AppMode.annotation],
            class: 'nav-link' + (state.appMode === AppMode.annotation ? ' active' : '')
        },
        [text('view')]
    )
    const editButton = h(
        'a',
        {
            onclick: [actions.setAppMode, AppMode.editing],
            class: 'nav-link' + (state.appMode === AppMode.editing ? ' active' : '')
        },
        [text('edit')]
    )
    return h('nav', {id: 'modeChooser', class: 'nav nav-tabs justify-content-center'}, [viewButton, editButton])
}


function editingView(state: AppState) {

    const editBody = h('div', {style: {padding: "50px", height: "40%"}}, [h('textarea', {
        id: 'chineseInput',
        name: 'chineseInput',
        class: 'chinese',
        placeholder: 'Enter Chinese text...',
        oninput: actions.setInputText,
    }, [text(state.inputText)]),])

    return h('div', {class: 'edit'}, [editBody])
}

function annotationView(state: AppState) {

    const modeChoices = [
        ['showingAllRadio', DisplayMode.showingAll, 'Show all'],
        ['showingSavedRadio', DisplayMode.showingSaved, 'Show saved'],
        ['hidingAllRadio', DisplayMode.hidingAll, 'Hide all']
    ]
    const displayModeChooserComponents = [];
    for (let choice of modeChoices) {
        const [id, mode, labelText] = choice;
        const radio = h('input', {
            id: id,
            name: 'displayMode',
            type: 'radio',
            class: 'form-radio',  // FIXME fix these classes to improve styling
            checked: state.displayMode === mode,
            onclick: [actions.setDisplayMode, mode]
        }, []);
        const label = h('label', {
            'class': 'form-radio-label',
            'for': id
        }, [text(labelText)]);
        const div = h('div', {'class': 'form-check form-check-inline'}, [radio, label]);
        displayModeChooserComponents.push(div);
    }

    const displayModeChooser = h('div',
        {class: 'form-check form-check-inline form-switch'},
        displayModeChooserComponents
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
        {class: 'form-check form-check-inline form-switch ms-auto'},
        [preserveLinesInput, preserveLinesLabel]
    );

    const topBar =  h(
        'div', {class: 'topbar'}, [displayModeChooser, preserveLines]
    );
    const annotatedDisplay = h('article', {}, [
        h('div', {
            id: 'annotated',
            class: 'chinese mx-0 mx-md-auto col-md-7'
        }, Array(...state.inputText).map(char => displayCharacter(char, state)))
    ]);
    return h('div', {}, [topBar, annotatedDisplay]);
}

function view(state: AppState) {
    let body;
    if (state.appMode === AppMode.editing) {
        body = editingView(state);
    } else if (state.appMode === AppMode.annotation) {
        body = annotationView(state);
    } else {
        throw new Error('Unknown app mode');
    }

    return h('div', {}, [modeChooser(state), body]);
}


app({
    node: document.getElementById('app'),
    view: view,
    subscriptions: (state) => [],
    init: initialState,
});
