const accentPatterns = [
    "(a|á|à|ä|â)", "(A|Á|À|Ä|Â)",
    "(e|é|è|ë|ê)", "(E|É|È|Ë|Ê)",
    "(i|í|ì|ï|î)", "(I|Í|Ì|Ï|Î)",
    "(o|ó|ò|ö|ô)", "(O|Ó|Ò|Ö|Ô)",
    "(u|ú|ù|ü|û)", "(U|Ú|Ù|Ü|Û)"
];

function escapeRegex(value, flags = "") {
    if (typeof value === 'string') {
        return new RegExp(value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } else if (value instanceof RegExp) {
        return escapeRegex(value.source, value.flags);
    } else {
        throw new TypeError("Expected string or RegExp, got " + typeof value);
    }
}

function regexAccentInsensitive(value, flags = "") {
    if (typeof value === 'string') {
        accentPatterns.forEach((pattern) => {
            value = value.replaceAll(new RegExp(pattern, "g"), pattern);
        });
        return new RegExp(value, flags);
    } else if (value instanceof RegExp) {
        return regexAccentInsensitive(value.source, value.flags);
    } else {
        throw new TypeError("Expected string or RegExp, got " + typeof value);
    }
}

function removeAccents(value) {
    if (typeof value === 'string') {
        accentPatterns.forEach((pattern) => {
            value = value.replaceAll(new RegExp(pattern, "g"), pattern[1]);
        });
        return value;
    } else {
        throw new TypeError("Expected string, got " + typeof value);
    }
}

function regexCaseInsensitive(value, flags = "") {
    if (typeof value === 'string') {
        if (!flags.includes("i")) {
            flags += "i";
        }
        return new RegExp(value, flags);
    } else if (value instanceof RegExp) {
        return regexCaseInsensitive(value.source, value.flags);
    } else {
        throw new TypeError("Expected string or RegExp, got " + typeof value);
    }
}

function regexMatchWhole(value, flags = "") {
    if (typeof value === 'string') {
        return new RegExp(`^${value}$`, flags);
    } else if (value instanceof RegExp) {
        return regexMatchWhole(value.source, value.flags);
    } else {
        throw new TypeError("Expected string or RegExp, got " + typeof value);
    }
}

function transformRegex(value, args={}) {
    const flags = args.flags || "";
    if (args.accentInsensitive) value = regexAccentInsensitive(value, flags);
    if (args.caseInsensitive) value = regexCaseInsensitive(value, flags);
    if (args.matchWhole) value = regexMatchWhole(value, flags);
    return value;
}

const alphanumericPattern = /[\w_-]/i;
const nonAlphanumericPattern = /[^\w_-]/i;

function isAlphanumeric(str) {
    return transformRegex(alphanumericPattern, {matchWhole: true}).test(str);
}

function toAlphanumeric(str, separator="-") {
    str = removeAccents(str);
    const words = str.split(/\s+/);
    return words.map(word => word.replaceAll(transformRegex(nonAlphanumericPattern, {matchWhole: true, flags: "g"}), separator)).join(" ");
}

module.exports = {
    escapeRegex,
    regexAccentInsensitive,
    removeAccents,
    regexCaseInsensitive,
    regexMatchWhole,
    transformRegex,
    isAlphanumeric,
    toAlphanumeric,

    alphanumericPattern,
    nonAlphanumericPattern
};