// jyutping lookup
const {CantoJpMin, cantojpmin_data} = (window as any);

// script conversion
import OpenCC from 'opencc-js';
import {ScriptConversionMode} from "./state.js";

export function toJyutping(char: string): string | null {
    if (Object.hasOwn(cantojpmin_data, char)) {
        return CantoJpMin.toJyutping(char);
    } else {
        return null;
    }
}

export function toJyutpingArray(char: string): string[] | null {
  if (Object.hasOwn(cantojpmin_data, char)) {
        return CantoJpMin.toJyutpingArray(char)[0].jyutpings;
    } else {
        return null;
    }
}

export function mdbgUrl(char: string): string {
    return `https://www.mdbg.net/chinese/dictionary?page=chardict&cdqchi=${char}`;
}

const traditionalConverter = OpenCC.Converter({from: 'cn', to: 'tw'});
const simplifiedConverter = OpenCC.Converter({ from: 'tw', to: 'cn' });

export function convertScript(text: string, newMode: ScriptConversionMode): string {
  switch (newMode) {
    case ScriptConversionMode.noconvert:
      return text;
    case ScriptConversionMode.traditional:
      return traditionalConverter(text);
    case ScriptConversionMode.simplified:
      return simplifiedConverter(text);
  }
}

/* For breaking text down to paragraphs, words and characters. */
export function breakdown(text: string): string[] {
  return text.split("\n\n")
}
