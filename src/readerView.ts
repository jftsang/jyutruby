import {h, text} from "hyperapp";
import {toJyutping, convertScript} from "./chinese.js";
import {AppState, DisplayMode, ScriptConversionMode, toggle} from "./state.js";
import {stateSaver} from "./storage.js";

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
    setScriptConversionMode: (state: AppState, newMode: ScriptConversionMode): AppState => {
      const converted = convertScript(state.inputText, newMode);
      return {...state, scriptConversion: newMode};
    },
    togglePreservingLines: (state: AppState): AppState => {
        return {...state, preservingLines: !state.preservingLines};
    },
};

for (const [key, value] of Object.entries(actions)) {
    actions[key] = stateSaver(value);
}

const displayCharacter = (char: string, highlight: boolean, showRuby: boolean, preserveLines: boolean) => {
    if (char === '\n') {
        if (!preserveLines) return;
        return h('br', {class: ''}, []);
    }

    const jyut = toJyutping(char);
    if (!jyut) {
        return text(char);
    }
    const rt = h('rt', {class: showRuby ? 'visible' : ''}, [text(jyut)])
    const classList = ['clickable'];
    if (highlight)
        classList.push('highlighted');
    return h('ruby', {
        class: classList,
        title: jyut,
        onclick: (state: AppState, event: MouseEvent): AppState => actions.handleCharacterClick(state, event, char)
    }, [rt, text(char)]);
};

export default function readerView(state: AppState) {
    const modeChoices: [string, DisplayMode, string][] = [
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
        {},
        displayModeChooserComponents
    );

    const scriptConversionChoices: [string, ScriptConversionMode, string][] = [
        ['noconvertRadio', ScriptConversionMode.noconvert, 'No conversion'],
        ['traditionalRadio', ScriptConversionMode.traditional, 'Traditional'],
        ['simplifiedRadio', ScriptConversionMode.simplified, 'Simplified'],
    ]
    const scriptConversionChooserComponents = [];
    for (let choice of scriptConversionChoices) {
        const [id, mode, labelText] = choice;
        const radio = h('input', {
            id: id,
            name: 'scriptConversion',
            type: 'radio',
            class: 'form-radio',
            checked: state.scriptConversion === mode,
            onclick: [actions.setScriptConversionMode, mode]
        }, []);
        const label = h('label', {
            'class': 'form-radio-label',
            'for': id
        }, [text(labelText)]);
        const div = h('div', {'class': 'form-check form-check-inline'}, [radio, label]);
        scriptConversionChooserComponents.push(div);
    }

    const scriptConversionChooser = h('div',
        {},
        scriptConversionChooserComponents
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
    }, [text('Preserve lines (for poetry)')]);
    const preserveLines = h('div',
        {class: 'form-check form-check-inline form-switch ms-auto'},
        [preserveLinesInput, preserveLinesLabel]
    );

    const spacer = h('div', {class: 'me-3'}, []);

    const topBar =  h(
        'div', {id: 'readerOptionsBar'}, [displayModeChooser, spacer, scriptConversionChooser, preserveLines]
    );
    const readerDisplay = h('article', {}, [
        h('div', {
            id: 'reader',
            class: 'chinese mx-0 mx-md-auto col-md-7'
        }, Array(...state.inputText).map(char => {
          const converted = convertScript(char, state.scriptConversion);
          const highlighted = state.savedCharacters.has(converted)
          const showRuby = (
            state.displayMode == DisplayMode.showingSaved
            && state.savedCharacters.has(converted)
          ) || (state.displayMode == DisplayMode.showingAll)
          return displayCharacter(converted, highlighted, showRuby, state.preservingLines);
        }))
    ]);
    return h('div', {}, [topBar, readerDisplay]);
}
