import React, { useRef } from "react";
import { BootstrapButton } from "src/lib/Bootstrap/Button";
import { FieldList, EditField } from "src/lib/Form";

export default function HomePage() {
    document.title = "Home | Bingo App";

    const testListRef = useRef(["a"]);
    const testTypesList = ["string"];

    function setTestList(list) {
        testListRef.current = list;
    }

    function stringField({
        value,
        setValue,
        moveUp,
        moveDown,
        remove,
        isFirstChild,
        isLastChild
    }) {
        return (
            <div>
                <h4>String</h4>
                <EditField
                    value={value}
                    setValue={setValue}
                    custom={true}
                    staticCustom={true}
                />
                <div className="btns-hor">
                    <BootstrapButton variant="secondary" outline={true} onClick={moveUp} disabled={isFirstChild}>Move Up</BootstrapButton>
                    <BootstrapButton variant="secondary" outline={true} onClick={moveDown} disabled={isLastChild}>Move Down</BootstrapButton>
                    <BootstrapButton variant="danger" outline={true} onClick={remove}>Remove</BootstrapButton>
                </div>
            </div>
        );
    }

    function numberField({
        value,
        setValue,
        moveUp,
        moveDown,
        remove,
        isFirstChild,
        isLastChild
    }) {
        return (
            <div>
                <h4>Number</h4>
                <EditField
                    value={value}
                    setValue={setValue}
                    custom={true}
                    staticCustom={true}
                    number={true}
                />
                <div className="btns-hor">
                    <BootstrapButton variant="secondary" outline={true} onClick={moveUp} disabled={isFirstChild}>Move Up</BootstrapButton>
                    <BootstrapButton variant="secondary" outline={true} onClick={moveDown} disabled={isLastChild}>Move Down</BootstrapButton>
                    <BootstrapButton variant="danger" outline={true} onClick={remove}>Remove</BootstrapButton>
                </div>
            </div>
        );
    }

    const typesMap = {
        string: {
            label: "String",
            elementFn: stringField
        },
        number: {
            label: "Number",
            elementFn: numberField
        }
    }

    return (
        <div className="HomePage container">
            <h2>Home</h2>
            <FieldList
                list={testListRef.current}
                setList={setTestList}
                types={testTypesList}
                typeMap={typesMap}
            />
        </div>
    );
}