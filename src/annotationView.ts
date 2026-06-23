import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";
import {AppState, DisplayMode, toggle} from "./state";
// @ts-ignore
import {h, text} from "hyperapp";

const actions = {
    handleCharacterClick: (state: AppState, event: MouseEvent, char: string): AppState => {
        event.preventDefault();

        const savedCharacters = new Set(state.savedCharacters);

        toggle(savedCharacters, char)

        return {
            ...state,
            savedCharacters: savedCharacters
        }
    },
    setDisplayMode: (state: AppState, newMode: DisplayMode): AppState => {
        return {...state, displayMode: newMode};
    },
    togglePreservingLines: (state: AppState): AppState => {
        return {...state, preservingLines: !state.preservingLines};
    },
};

function toJyutping(char: string): string | null {
    if (Object.hasOwn(cantojpmin_data, char)) {
        // @ts-ignore
        return CantoJpMin.toJyutping(char);
    } else {
        return null;
    }
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

export default function annotationView(state: AppState) {
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
