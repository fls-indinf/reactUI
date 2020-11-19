import Size from "./Size";

export function parseJVxSize(size:string|undefined):Size|undefined {
    if (size) {
        const sizeSplitted = size.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])}
    }
    else
        return undefined;
}