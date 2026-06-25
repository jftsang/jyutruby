// jyutping lookup
const {CantoJpMin, cantojpmin_data} = (window as any);

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
