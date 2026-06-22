const STORAGE_KEY = 'jyutruby';

export const saveToStorage = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    inputText: state.inputText,
    annotatedCharacters: [...state.annotatedCharacters]
  }));
};

export const loadFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  const parsed = JSON.parse(saved);
  return {
    ...parsed,
    annotatedCharacters: new Set(parsed.annotatedCharacters)
  };
};

export const stateSaver = (action) => {
  return (state, ...args) => {
    const newState = action(state, ...args);
    saveToStorage(newState);
    return newState;
  }
}
