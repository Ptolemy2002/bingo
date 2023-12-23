import React, { useRef, useState } from "react";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import { isNullOrUndefined } from "src/lib/Misc";
import { nanoid } from "nanoid";
import { useForceRerender } from "src/lib/Misc";
import { BootstrapButton } from "./Bootstrap/Button";

export function EditField({
    name,
    label,

    value: initValue = "",
    setValue: setValueHandler,
    defaultValue = "",

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
}) {
    const [value, _setValue] = useState(initValue);
    const [prevValue, setPrevValue] = useState(value);
    const [custom, _setCustom] = useState(initCustom);
    
    function setValue(v) {
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
            if (integer && !Number.isInteger(v)) return false;
            if (!isNullOrUndefined(min) && v < min) return false;
            if (!isNullOrUndefined(max) && v > max) return false;
        }

        return _validate ? _validate(v) : true;
    }

    function onChange(event) {
        if (!validate(event.target.value)) return;
        setValue(event.target.value);
    }

    const optionsElement = (
        <div className="btns-hor">
            {
                !staticCustom ? (
                    <BootstrapButton variant="secondary" ouline={true} onClick={() => setCustom(!custom)}>
                        {custom ? existingMessage : customMessage}
                    </BootstrapButton>
                ) : null
            }
            
            {
                custom ? null : (
                    <BootstrapButton
                        variant="secondary"
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
                        variant="secondary"
                        outline={true} 
                        onClick={() => {if (setValueHandler) setValueHandler(value)}}
                    >
                        Save
                    </BootstrapButton>
                ) : null
            }
        </div>
    );

    if (custom) {
        return (
            <div className="form-group mb-2">
                <label htmlFor={name}><h6>{label}</h6></label>
                <input type="text" placeholder={placeholder} className="form-control" value={value} onChange={onChange} name={name} />
                {optionsElement}
            </div>
        );
    } else {
        if (!listStatus.completed) {
            return (
                <p>{inProgressMessage}</p>
            );
        } else if (listStatus.failed) {
            return (
                <BootstrapAlert type="danger" allowDismiss={false}>
                    <BootstrapAlert.Heading>Error</BootstrapAlert.Heading>
                    <p>{failedMessage}</p>
                </BootstrapAlert>
            );
        } else {
            const choices = list.current.map((item, i) => {
                return (
                    <option key={"option-" + i} value={item}>{item}</option>
                );
            });

            return (
                <div className="form-group mb-1">
                    <label htmlFor={name}><h6>{label}</h6></label>
                    <select className="form-control mb-1" value={value} onChange={onChange} name={name}>
                        {choices}
                    </select>
                    {optionsElement}
                </div>
            );
        }
    }
}

export function FieldList({
    list: initList = [],
    setList: setListHandler,
    types: initTypeList = [],
    typeMap = {},
}) {
    const listRef = useRef(initList);
    const typeListRef = useRef(initTypeList);

    const forceRerender = useForceRerender();

    const types = Object.keys(typeMap);

    function set(index, value) {
        const newList = [...listRef.current];
        newList[index] = value;
        listRef.current = newList;
        if (setListHandler) setListHandler(listRef.current);
    }

    function remove(index) {
        const newList = [...listRef.current];
        const newTypeList = [...typeListRef.current];

        newList.splice(index, 1);
        newTypeList.splice(index, 1);

        listRef.current = newList;
        typeListRef.current = newTypeList;

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function moveUp(index) {
        if (index === 0) return;

        const newList = [...listRef.current];
        const newTypeList = [...typeListRef.current];

        const temp = newList[index];
        newList[index] = newList[index - 1];
        newList[index - 1] = temp;

        const temp2 = newTypeList[index];
        newTypeList[index] = newTypeList[index - 1];
        newTypeList[index - 1] = temp2;

        listRef.current = newList;
        typeListRef.current = newTypeList;

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function moveDown(index) {
        if (index === listRef.current.length - 1) return;

        const newList = [...listRef.current];
        const newTypeList = [...typeListRef.current];

        const temp = newList[index];
        newList[index] = newList[index + 1];
        newList[index + 1] = temp;

        const temp2 = newTypeList[index];
        newTypeList[index] = newTypeList[index + 1];
        newTypeList[index + 1] = temp2;

        listRef.current = newList;
        typeListRef.current = newTypeList;

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    function add(type, value) {
        const newList = [...listRef.current];
        const newTypeList = [...typeListRef.current];

        newList.push(value);
        newTypeList.push(type);

        listRef.current = newList;
        typeListRef.current = newTypeList;

        if (setListHandler) setListHandler(listRef.current);
        forceRerender();
    }

    const elements = listRef.current.map((value, i) => {
        const type = typeListRef.current[i];
        const {elementFn} = typeMap[type];

        return (
            <div key={"field-list-" + nanoid()} className="edit-container mb-1">
                {elementFn({
                    value: value,
                    setValue: (v) => set(i, v),
                    remove: () => remove(i),
                    moveUp: () => {
                        moveUp(i)
                    },
                    moveDown: () => moveDown(i),
                    isFirstChild: i === 0,
                    isLastChild: i === listRef.current.length - 1
                })}
            </div>
        );
    });

    const addButtons = types.map((type, i) => {
        const {label} = typeMap[type];

        return (
            <BootstrapButton key={"add-button-" + nanoid()} variant="secondary" outline={true} onClick={() => add(type, "")}>
                Add "{label}"
            </BootstrapButton>
        );
    });

    return (
        <div className="field-list">
            {elements}

            <div className="mb-1">
                <div className="btns-hor">
                    {addButtons}
                </div>
            </div>
        </div>
    );
}