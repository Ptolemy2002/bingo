import React, { useState } from "react";
import BootstrapAlert from "./Bootstrap/Alert";

export function EditField(props) {
    const [value, _setValue] = useState(props.value);
    const [prevValue, setPrevValue] = useState(value);
    const [custom, _setCustom] = useState(props.custom);
    
    function setValue(v) {
        _setValue(v);
        if (props.setValue && !props.manualSave) props.setValue(v);
    }

    function setCustom(v) {
        _setCustom(v);
        if (v) {
            setPrevValue(value);
            setValue(props.defaultValue);
        } else {
            setValue(prevValue);
        }
    }

    function isNullOrUndefined(v) {
        return v === null || v === undefined;
    }

    function validate(v) {
        if (props.number || props.integer) {
            if (v === "") return true;
            if (v === "-" && (isNullOrUndefined(props.min) || props.min < 0)) return true;
            if (v === "+" && (isNullOrUndefined(props.max) || props.max >= 0)) return true;
            if (isNaN(v) || isNaN(parseFloat(v))) return false;
            if (props.integer && !Number.isInteger(v)) return false;
            if (!isNullOrUndefined(props.min) && v < props.min) return false;
            if (!isNullOrUndefined(props.max) && v > props.max) return false;
        }

        return true;
    }

    function onChange(event) {
        if (!validate(event.target.value)) return;
        setValue(event.target.value);
    }

    const optionsElement = (
        <div className={props.optionsClassName}>
            {
                !props.staticCustom ? (
                    <button className="btn btn-outline-secondary" onClick={() => setCustom(!custom)}>
                        {custom ? props.existingMessage : props.customMessage}
                    </button>
                ) : null
            }
            
            {
                custom ? null : (
                    <button
                        className="btn btn-outline-secondary"
                        onClick={props.refreshHandler}
                        disabled={props.listStatus.inProgress}
                    >
                        {
                            props.listStatus.inProgress ?
                                "Unavailable":
                            // Else
                            props.refreshMessage
                        }
                    </button>
                )
            }

            {
                props.manualSave ? (
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {if (props.setValue) props.setValue(value)}}
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
                <label htmlFor={props.name}><h6>{props.label}</h6></label>
                <input type="text" placeholder={props.placeholder} className="form-control" value={value} onChange={onChange} name={props.name} />
                {optionsElement}
            </div>
        );
    } else {
        if (!props.listStatus.completed) {
            return (
                <p>{props.inProgressMessage}</p>
            );
        } else if (props.listStatus.failed) {
            return (
                <BootstrapAlert type="danger" allowDismiss={false}>
                    <BootstrapAlert.Heading>Error</BootstrapAlert.Heading>
                    <p>{props.failedMessage}</p>
                </BootstrapAlert>
            );
        } else {
            const choices = props.list.map((item, i) => {
                return (
                    <option key={"option-" + i} value={item}>{item}</option>
                );
            });

            return (
                <div className="form-group mb-1">
                    <label htmlFor={props.name}><h6>{props.label}</h6></label>
                    <select className="form-control mb-1" value={value} onChange={onChange} name={props.name}>
                        {choices}
                    </select>
                    {optionsElement}
                </div>
            );
        }
    }
}