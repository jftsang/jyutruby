import {FlashcardState} from "./flashcardView.js";
import {defaultText} from "./defaultText.js";

export enum DisplayMode {
    showingAll,
    showingSaved,
    hidingAll,
}

export enum AppMode {
    reading,
    editing,
    review,
    flashcard,
}

export enum ScriptConversionMode {
  noconvert, traditional, simplified,
}

export interface AppState {
    inputText: string;
    /*
     * Simplified and traditional forms of the same character are stored
     * separately, so that you can flag the simplified form but not the
     * traditional form.
     */
    savedCharacters: Set<string>;
    appMode: AppMode,
    displayMode: DisplayMode,
    scriptConversion: ScriptConversionMode;
    preservingLines: boolean
    flashcardState: FlashcardState;
}

export function toggle<T>(set: Set<T>, x: T): void {
    if (set.has(x))
        set.delete(x)
    else
        set.add(x)
}

export const defaultInitialState: AppState = {
  inputText: defaultText,
  savedCharacters: new Set(['人',
      '之',
      '初']),
  appMode: AppMode.reading,
  displayMode: DisplayMode.showingSaved,
  scriptConversion: ScriptConversionMode.traditional,
  preservingLines: true,
  flashcardState: {currentCharacter: null, flipped: false},
};
