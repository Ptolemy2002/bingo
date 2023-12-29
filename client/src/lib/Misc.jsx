import { useEffect, useState, useCallback } from 'react';

export function listInPlainEnglish(list, {max = undefined, conjunction = "and"}={}) {
    if (max === undefined) max = list.length;
    

    if (list.length === 0) {
        return '';
    }
    if (list.length === 1) {
        return list[0];
    }
    if (list.length === 2) {
        return `${list[0]} ${conjunction} ${list[1]}`;
    }

    list = list.map((v, i) => {
        if (i === list.length - 1) return v;
        
        if (v.endsWith(`"`)) {
            return v.slice(0, -2) + `," `;
        } else if (v.endsWith(`'`)) {
            return v.slice(0, -2) + `,' `;
        } else {
            return v + ', ';
        }
    })

    if (list.length > max) {
        return `${list.slice(0, max).join('')}${conjunction} ${list.length - max} more`;
    } else {
        return `${list.slice(0, -1).join('')}${conjunction} ${list[list.length - 1]}`;
    }
}

export function useMountEffect(callback) {
    useEffect(callback, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function combineClassNames(...classNames) {
    classNames = classNames.filter(c => c);

    const individualClassNames = classNames.map(c => c.split(' ')).flat();
    const uniqueClassNames = [...new Set(individualClassNames)];

    return uniqueClassNames.join(' ');
}

export function isNullOrUndefined(v) {
    return v === null || v === undefined;
}

export function useForceRerender() {
    const [, setTick] = useState(0);
    const update = useCallback(() => {
        setTick(tick => tick + 1);
    }, []);

    return update;
}

export function Spacer({ size = "1rem", horizontal = false }={}) {
    const keyName = horizontal ? "width" : "height";
    return <div className="spacer" style={{ [keyName]: size }} />;
}

export function clamp(value, min, max) {
    if (!isNullOrUndefined(min) && value < min) return min;
    if (!isNullOrUndefined(max) && value > max) return max;
    return value;
}

export function wrapNumber(index, minimum, maximum) {
    // Calculate the range (maximum - minimum)
    const range = maximum - minimum;
  
    // Adjust the index to be within the range
    let adjustedIndex = index - minimum;
  
    // If the adjusted index is negative, wrap to the end
    if (adjustedIndex < 0) {
      adjustedIndex = range + (adjustedIndex % range) + 1;
    }
  
    // Wrap the index to the beginning or end
    const wrappedIndex = (adjustedIndex % (range + 1)) + minimum;
  
    // Return the wrapped index
    return wrappedIndex;
}