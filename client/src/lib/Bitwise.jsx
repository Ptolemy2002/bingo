/* global BigInt */

export function asBigInt(value) {
    if (typeof value === "bigint") {
        return value;
    } else if (typeof value === "number" || typeof value === "string") {
        return BigInt(value);
    } else {
        throw new TypeError(`Cannot convert value of type [${typeof value}] to BigInt.`);
    }
}

export function isBitOn(mask, bit) {
    mask = asBigInt(mask);
    bit = asBigInt(bit);
    return (mask & (1n << bit)) !== 0n;
}

export function setBit(mask, bit, value) {
    mask = asBigInt(mask);
    bit = asBigInt(bit);
    // Convert the value to a boolean.
    value = !!value;

    if (value) {
        return mask | (1n << bit);
    } else {
        return mask & ~(1n << bit);
    }
}

export function toggleBit(mask, bit) {
    mask = asBigInt(mask);
    bit = asBigInt(bit);
    return mask ^ (1n << bit);
}