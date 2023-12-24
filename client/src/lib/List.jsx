export function listsEqual(a, b) {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!listsEqual(a[i], b[i])) return false;
        } else if (a[i] !== b[i]) {
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