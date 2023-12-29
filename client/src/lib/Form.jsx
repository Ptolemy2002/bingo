import React, { useRef, useState, useEffect } from "react";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import {combineClassNames, isNullOrUndefined } from "src/lib/Misc";
import { listPush, listSet, listSwap, listRemove } from "src/lib/List";
import { useForceRerender, clamp } from "src/lib/Misc";
import  BootstrapButton from "src/lib/Bootstrap/Button";
import { nanoid } from "nanoid";
import { cleanString } from "src/lib/Regex";

export function EditField({
    name,
    label,

    value: _value = "",
    setValue: setValueHandler,
    defaultValue = "",
    textArea = false,

    custom: initCustom = true,
    staticCustom = true,
    placeholder = "Enter a value",

    number = false,
    integer = false,
    min = null,
    max = null,
    validate: _validate,

    existingMessage = "Use Existing",
    customMessage = "Use Custom",

    list = [],
    listStatus = {
        inProgress: false,
        completed: false,
        failed: false,
    },
    refreshHandler = () => {},
    refreshMessage = "Refresh",
    inProgressMessage = "Loading...",
    failedMessage = "Failed.",

    manualSave = false,
    saveText = "Save",
    fieldRef = null,

    className = null,
    column = false,
    hLevel = 6,
    keyboardShortcuts = []
}={}) {
    const [value, _setValue] = useState(_value);
    const [prevValue, setPrevValue] = useState(_value);
    const [custom, _setCustom] = useState(initCustom);

    useEffect(() => {
        _setValue(_value);
    }, [_value]);
    
    function setValue(v) {
        if (!custom && !list?.some(item => item === v || (typeof item === "object" && item.value === v))) {
            v = defaultValue;
        }

        _setValue(v);
        if (setValueHandler && !manualSave) setValueHandler(v);
    }

    function setCustom(v) {
        _setCustom(v);
        if (v) {
            setPrevValue(value);
            setValue(defaultValue);
        } else {
            setValue(prevValue);
        }
    }

    function validate(v) {
        if (number || integer) {
            if (v === "") return true;
            if (v === "-" && (isNullOrUndefined(min) || min < 0)) return true;
            if (v === "+" && (isNullOrUndefined(max) || max >= 0)) return true;
            if (isNaN(v) || isNaN(parseFloat(v))) return false;
            if (integer && !(/^\d+$/.test(v))) return false;
            if (!isNullOrUndefined(min) && v < min) return false;
            if (!isNullOrUndefined(max) && v > max) return false;
        }

        return _validate ? _validate(v) : true;
    }

    function onChange(event) {
        if (!validate(event.target.value)) return;
        setValue(event.target.value);
    }

    function handleKeyUp(event) {
        if (manualSave && event.key === "Enter") {
            if (setValueHandler) setValueHandler(value);
        }
    }

    function handleKeyDown(event) {
        let handled = false;
        keyboardShortcuts.forEach(({modifiers=[], key="", fn=() => {}}) => {
            if (!handled && modifiers.every(modifier => event[modifier + "Key"]) && event.key === key) {
                event.preventDefault();
                fn(event);
                handled = true;
            }
        });
    }

    const optionsElement = (
        <div className="btns-hor">
            {
                !staticCustom ? (
                    <BootstrapButton type="secondary" outline={true} onClick={() => setCustom(!custom)}>
                        {custom ? existingMessage : customMessage}
                    </BootstrapButton>
                ) : null
            }
            
            {
                custom ? null : (
                    <BootstrapButton
                        type="secondary"
                        outline={true}
                        onClick={refreshHandler}
                        disabled={listStatus.inProgress}
                    >
                        {
                            listStatus.inProgress ?
                                "Unavailable":
                            // Else
                            refreshMessage
                        }
                    </BootstrapButton>
                )
            }

            {
                manualSave ? (
                    <BootstrapButton
                        type="secondary"
                        outline={true} 
                        onClick={() => {if (setValueHandler) setValueHandler(value)}}
                    >
                        {saveText}
                    </BootstrapButton>
                ) : null
            }
        </div>
    );

    if (custom) {
        const HTag = "h" + clamp(hLevel, 1, 6);
        return (
            <div className={combineClassNames("form-group mb-1", className)}>
                <div className="form-row">
                    {label && !textArea && !column ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}
                    {
                        textArea ? (
                            <div className="form-column">
                                {label ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}
                                <textarea
                                    ref={fieldRef}
                                    placeholder={placeholder}
                                    className="form-control mb-1"
                                    value={value || ""}
                                    onChange={onChange}
                                    name={name}
                                    onKeyUp={handleKeyUp}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                        ):
                        // Else If
                        column ? (
                            <div className="form-column">
                                {label ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}
                                <input ref={fieldRef} type="text" placeholder={placeholder} className="form-control mb-1" value={value || ""} onChange={onChange} name={name} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} />
                            </div>
                        ):
                        // Else
                        (    
                            <input ref={fieldRef} type="text" placeholder={placeholder} className="form-control mb-1" value={value || ""} onChange={onChange} name={name} onKeyUp={handleKeyUp} onKeyDown={handleKeyDown} />
                        )
                    }

                    {optionsElement}
                </div>
            </div>
        );
    } else {
        if (!listStatus.completed) {
            return (
                <BootstrapAlert type="info" allowDismiss={false}>
                    <BootstrapAlert.Heading>Loading...</BootstrapAlert.Heading>
                    <p>{inProgressMessage}</p>
                </BootstrapAlert>
            );
        } else if (listStatus.failed) {
            return (
                <BootstrapAlert type="danger" allowDismiss={false}>
                    <BootstrapAlert.Heading>Error</BootstrapAlert.Heading>
                    <p>{failedMessage}</p>
                </BootstrapAlert>
            );
        } else {
            const choices = list.map((item, i) => {
                if (typeof item === "object") {
                    return (
                        <option key={"option-" + i} value={item.value || i}>{item.label || item.value}</option>
                    );
                } else {
                    return (
                        <option key={"option-" + i} value={item}>{item}</option>
                    );
                }
            });

            const HTag = "h" + clamp(hLevel, 1, 6);

            return (
                <div className={combineClassNames("form-group mb-1", className)}>
                    <div className="form-row">
                        {label && !column ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}

                        {
                            column ? (
                                <div className="form-column">
                                    {label ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}
                                    <select ref={fieldRef} className="form-control mb-1" value={value} onChange={onChange} name={name}>
                                        {choices}
                                    </select>
                                    {optionsElement}
                                </div>
                            ):
                            // Else
                            (
                                <div className="form-column">
                                    {label ? <label htmlFor={name}><HTag>{label}</HTag></label> : null}
                                    <select ref={fieldRef} className="form-control mb-1" value={value} onChange={onChange} name={name}>
                                        {choices}
                                    </select>
                                    {optionsElement}
                                </div>
                            )
                        }
                    </div>
                </div>
            );
        }
    }
}

export function CustomStringField(props={}) {
    return (
        <EditField
            {...props}
            custom={true}
            staticCustom={true}
        />
    );
}

export function CustomNumberField(props={}) {
    return (
        <EditField
            {...props}
            custom={true}
            staticCustom={true}
            number={true}
        />
    );
}

export function EditFieldWithFilter({
    label,
    hLevel = 6,
    custom = false,
    list = [],
    className = null,
    value = "",
    setValue: setValueHandler,
    ...props
}={}) {
    const [filter, setFilter] = useState("");

    function itemMatches(item, v) {
        v = cleanString(v);

        if (typeof item === "object") {
            if (item.matches) {
                return item.matches(v);
            } else if (item.label) {
                return cleanString(item.label).includes(v);
            } else {
                return cleanString(item.value).includes(v);
            }
        } else {
            return cleanString(item).includes(v);
        }
    }

    const filteredList = list?.filter(item => itemMatches(item, filter));

    const HTag = "h" + clamp(hLevel, 1, 6);

    if (filteredList && filteredList.length === 0) {
        return (
            <div className={combineClassNames("filter-select-field", className)}>
                {label ? <HTag>{label}</HTag> : null}
                <CustomStringField
                    name="choice-filter"
                    label="Choice Filter"
                    value={filter}
                    setValue={setFilter}
                    defaultValue={filter}
                    placeholder="Enter a filter"
                    manualSave={true}
                    saveText="Apply"
                />

                <BootstrapAlert type="info" allowDismiss={false}>
                    <BootstrapAlert.Heading>No Matches</BootstrapAlert.Heading>
                    <p>No matches found.</p>
                </BootstrapAlert>
            </div>
        );
    }

    return (
        <div className={combineClassNames("filter-select-field", className)}>
            {label ? <HTag>{label}</HTag> : null}

            {
                custom ? null : (
                    <CustomStringField
                        name="choice-filter"
                        label="Choice Filter"
                        value={filter}
                        setValue={setFilter}
                        defaultValue={filter}
                        placeholder="Enter a filter"
                        manualSave={true}
                        saveText="Apply"
                        hLevel={hLevel + 1}
                    />
                )
            }

            <EditField
                {...props}
                list={filteredList}
                custom={custom}
                hLevel={hLevel + 1}
                value={value}
                setValue={setValueHandler}
            />
        </div>
    );
}

export function FieldList({
    list: initList = [],
    setList: setListHandler,
    types: initTypeList = [],
    typeMap = {},
    maxLength = null,
    expanded: initExpanded = true,
    className = null
}={}) {
    const listRef = useRef(initList);
    const keysListRef = useRef(initList.map(() => nanoid()));
    const typeListRef = useRef(initTypeList);

    const [expanded, setExpanded] = useState(initExpanded);

    const forceRerender = useForceRerender();

    const types = Object.keys(typeMap);

    function set(index, value) {
        listRef.current = listSet(listRef.current, index, value);
        if (setListHandler) setListHandler(listRef.current);
    }

    function remove(index) {
        listRef.current = listRemove(listRef.current, index);
        typeListRef.current = listRemove(typeListRef.current, index);
        keysListRef.current = listRemove(keysListRef.current, index);

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function moveUp(index) {
        if (index === 0) return;

        listRef.current = listSwap(listRef.current, index, index - 1);
        typeListRef.current = listSwap(typeListRef.current, index, index - 1);
        keysListRef.current = listSwap(keysListRef.current, index, index - 1);

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function moveDown(index) {
        if (index === listRef.current.length - 1) return;

        listRef.current = listSwap(listRef.current, index, index + 1);
        typeListRef.current = listSwap(typeListRef.current, index, index + 1);
        keysListRef.current = listSwap(keysListRef.current, index, index + 1);

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function add(type, value) {
        listRef.current = listPush(listRef.current, value);
        typeListRef.current = listPush(typeListRef.current, type);
        keysListRef.current = listPush(keysListRef.current, nanoid());

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    const elements = listRef.current.map((value, i) => {
        const type = typeListRef.current[i];
        const {elementFn} = typeMap[type];
        const key = keysListRef.current[i];

        return (
            <div key={"field-list-" + key} className="edit-container mb-1">
                {elementFn({
                    value: value,
                    index: i,
                    setValue: (v) => set(i, v),
                    remove: () => remove(i),
                    moveUp: () => moveUp(i),
                    moveDown: () => moveDown(i),
                    isFirstChild: i === 0,
                    isLastChild: i === listRef.current.length - 1
                })}
            </div>
        );
    });

    const addButtons = types.map((type, i) => {
        const {label, defaultValue} = typeMap[type];

        return (
            <BootstrapButton
                key={"add-button-" + type}
                type="secondary"
                outline={true}
                onClick={() => add(type, defaultValue || "")}
                disabled={maxLength && listRef.current.length >= maxLength}
            >
                Add "{label}"
            </BootstrapButton>
        );
    });

    return (
        <div className={combineClassNames("field-list", className)}>
            <BootstrapButton
                type="secondary"
                outline={true}
                onClick={() => setExpanded(!expanded)}
                className={combineClassNames(expanded ? "mb-3" : null)}
            >
                {expanded ? "Collapse" : "Expand"}
            </BootstrapButton>

            {expanded ? elements : null}

            {
                expanded ? (
                    <div className="btns-hor mb-1">
                        {addButtons}
                    </div>
                ) : null
            }
        </div>
    );
}

export function PageField({
    name,
    label,

    page=1,
    setPage: setPageHandler,
    pageCount=1,

    fieldRef = null,
    className = null,
    column = false
}={}) {
    return (
        <EditField
            name={name}
            label={label}
            value={page}
            setValue={setPageHandler}
            defaultValue={page}
            placeholder="Enter a page number"
            number={true}
            integer={true}
            min={1}
            max={pageCount}
            manualSave={true}
            saveText="Go"
            fieldRef={fieldRef}
            className={className}
            column={column}
        />
    );
}

// Hack to set the value of a field while still triggering onChange
export function manualChangeFieldValue(field, newValue) {
    // This hack is from https://github.com/facebook/react/issues/11488#issuecomment-347775628
    const lastValue = field.value;
    field.value = newValue;
    const event = new Event("input", { bubbles: true });

    // hack React15
    event.simulated = true;

    // hack React16
    const tracker = field._valueTracker;
    if (tracker) {
        tracker.setValue(lastValue);
    }
    field.dispatchEvent(event);
}

export function wrapSelection(field, before="", after="", defaultValue=null, defaultSelectionOffset=[0, 0]) {
    if (!field) return;

    const start = field.selectionStart;
    const end = field.selectionEnd;

    const value = field.value;
    const selection = value.substring(start, end);


    if (!selection && defaultValue) {
        // It needs to be done this way so tha onChange is triggered correctly
        manualChangeFieldValue(field, value.substring(0, start)  + defaultValue  + value.substring(end));
        field.setSelectionRange(start + defaultSelectionOffset[0], end + defaultValue.length + defaultSelectionOffset[1]);
    } else {
        before = before.replaceAll("$SELECTION", selection);
        after = after.replaceAll("$SELECTION", selection);
        const replacement = `${before}${selection}${after}`;
        
        // It needs to be done this way so tha onChange is triggered correctly
        manualChangeFieldValue(field, value.substring(0, start) + replacement + value.substring(end));
        field.setSelectionRange(start + before.length, end + before.length);
    }

    field.focus();
}