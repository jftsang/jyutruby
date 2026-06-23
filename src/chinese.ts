import {cantojpmin_data} from "./CantoJpMin/scripts/modules_format/cantojpmin_data.js";

export function toJyutping(char: string): string | null {
    if (Object.hasOwn(cantojpmin_data, char)) {
        // @ts-ignore
        return CantoJpMin.toJyutping(char);
    } else {
        return null;
    }
}
export function toJyutpingArray(char: string): string[] | null {
    if (Object.hasOwn(cantojpmin_data, char)) {
        // @ts-ignore
        return CantoJpMin.toJyutpingArray(char)[0].jyutpings;
    } else {
        return null;
    }
}
