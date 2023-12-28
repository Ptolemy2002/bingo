import React, { useState } from "react";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import BootstrapButton from "./Bootstrap/Button";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { combineClassNames } from "src/lib/Misc";
import { manualChangeFieldValue } from "src/lib/Form";

export function MarkdownLink({ node, href, children, ...props }={}) {
    return (
        <Link to={href} {...props} target="_blank" rel="noopener noreferrer">{children}</Link>
    );
}

export default function MarkdownRenderer({ baseHLevel=1, children, ...props }={}) {
    const hLevelOverride = {};

    for (let i = 1; i <= 6; i++) {
        if (i + baseHLevel - 1 > 6) {
            hLevelOverride[`h${i}`] = `h6`;
        } else {
            hLevelOverride[`h${i}`] = `h${i + baseHLevel - 1}`;
        }
    }

    return (
        <Markdown
            {...props}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                a: MarkdownLink,
                ...hLevelOverride
            }}
        >
            {children}
        </Markdown>
    );
}

export function MarkdownEditorButtons({ elementRef, show: initShow, className, ...props }={}) {
    const [show, setShow] = useState(initShow);

    function wrapSelection(before="", after="", defaultValue=null, defaultSelectionOffset=[0, 0]) {
        const field = elementRef.current;

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

    if (show) {
        return (
            <div className={combineClassNames("markdown-editor-btns", className)} {...props}>
                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => setShow(false)}
                >
                    Hide Markdown Options
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("**", "**", "**bold text**", [2, -2])}
                >
                    Bold
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("_", "_", "_italic text_", [1, -1])}
                >
                    Italic
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("~", "~", "~strikethrough text~", [1, -1])}
                >
                    Strikethrough
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("$", "$", "$x^2$", [1, -1])}
                >
                    Math
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("[", "](https://google.com)", "[Link Text](https://google.com)", [1, -21])}
                >
                    Link
                </BootstrapButton>
            </div>
        );
    } else {
        return (
            <div className={combineClassNames("markdown-editor-btns", className)} {...props}>
                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => setShow(true)}
                >
                    Show Markdown Options
                </BootstrapButton>
            </div>
        );
    }
}