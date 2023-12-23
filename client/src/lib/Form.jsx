import React, { useState } from "react";
import BootstrapAlert from "src/lib/Bootstrap/Alert";
import { isNullOrUndefined } from "sec/lib/Misc";
import { nanoid } from "nanoid";

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
                    <button className="btn btn-outline-secondary" onClick={() => setCustom(!custom)}>
                        {custom ? existingMessage : customMessage}
                    </button>
                ) : null
            }
            
            {
                custom ? null : (
                    <button
                        className="btn btn-outline-secondary"
                        onClick={refreshHandler}
                        disabled={listStatus.inProgress}
                    >
                        {
                            listStatus.inProgress ?
                                "Unavailable":
                            // Else
                            refreshMessage
                        }
                    </button>
                )
            }

            {
                manualSave ? (
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {if (setValueHandler) setValueHandler(value)}}
                    >
                        Save
                    </button>
                ) : null
            }
        </div>
    );

    if (custom) {
        return (
            <div className="form-group mb-1">
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
            const choices = list.map((item, i) => {
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