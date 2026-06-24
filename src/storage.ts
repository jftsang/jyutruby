import {AppState} from "./state.js";

const STORAGE_KEY = 'jyutruby';

export const saveToStorage = (state: AppState): void => {
    const serialized = {
        ...state,
        savedCharacters: Array.from(state.savedCharacters)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
};

export const loadFromStorage = (): AppState | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    parsed.savedCharacters = new Set(parsed.savedCharacters);
    return parsed;
};

type AnyFunction = (...args: any[]) => any;

type Action<T extends AnyFunction> = (state: AppState, ...args: Parameters<T>) => AppState;

export function stateSaver<T extends AnyFunction>(action: Action<T>): Action<T> {
    return (state: AppState, ...args: Parameters<T>): AppState => {
        const newState = action(state, ...args);
        saveToStorage(newState);
        return newState;
    }
}
