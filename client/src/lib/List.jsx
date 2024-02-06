import isCallable from "is-callable";

export function listsEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!listsEqual(a[i], b[i])) return false;
        } else if (typeof a[i] === "object" && typeof b[i] === "object") {
            if (!objectsEqual(a[i], b[i])) return false;
        } else if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

export function objectsEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const key in a) {
        if (Array.isArray(a[key]) && Array.isArray(b[key])) {
            if (!listsEqual(a[key], b[key])) return false;
        } else if (typeof a[key] === "object" && typeof b[key] === "object") {
            if (!objectsEqual(a[key], b[key])) return false;
        } else if (a[key] !== b[key]) {
            return false;
        }
    }

    return true;
}

export function listSwap(list, i, j) {
    const newList = [...list];
    const temp = newList[i];
    newList[i] = newList[j];
    newList[j] = temp;
    return newList;
}

export function listRemove(list, i) {
    const newList = [...list];
    newList.splice(i, 1);
    return newList;
}

export function listPush(list, element) {
    return [...list, element];
}

export function listSet(list, i, element) {
    const newList = [...list];
    newList[i] = element;
    return newList;
}

export function isSet(list) {
    const seen = [];
    for(let i = 0; i < list.length; i++) {
        if (seen.includes(list[i])) return false;
        seen.push(list[i]);
    }
    return true;
}

export function listDifference(a, b, keyConvert=null, valueConvert=null) {
    if (!isCallable(keyConvert)) keyConvert = (x) => x;
    if (!isCallable(valueConvert)) valueConvert = (x) => x;

    const result = {};
    a.forEach((element, i) => {
        if (b[i] !== element) {
            result[keyConvert(i)] = valueConvert(b[i]);
        }
    });

    if (b.length > a.length) {
        for (let i = a.length; i < b.length; i++) {
            result[keyConvert(i)] = valueConvert(b[i]);
        }
    }

    return result;
}