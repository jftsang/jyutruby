import {AppState} from "./state";

const STORAGE_KEY = 'jyutruby';

export const saveToStorage = (state: AppState): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadFromStorage = (): AppState | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
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
