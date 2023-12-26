import React, { useState } from "react";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import BootstrapButton from "./Bootstrap/Button";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export function MarkdownLink({ node, href, children, ...props }) {
    return (
        <Link to={href} {...props} target="_blank" rel="noopener noreferrer">{children}</Link>
    );
}

export default function MarkdownRenderer({ baseHLevel=1, children, ...props }) {
    const hLevelOverride = {};

    for (let i = 1; i <= 6; i++) {
        if (i + baseHLevel > 6) {
            hLevelOverride[`h${i}`] = `h6`;
        } else {
            hLevelOverride[`h${i}`] = `h${i + baseHLevel}`;
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

export function MarkdownEditorButtons({ elementRef, show: initShow, ...props }) {
    const [show, setShow] = useState(initShow);

    function manualOnChange(newValue) {
        // This hack is from https://github.com/facebook/react/issues/11488#issuecomment-347775628
        const field = elementRef.current;
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

    function wrapSelection(before="", after="", defaultValue=null) {
        const field = elementRef.current;

        if (!field) return;

        const start = field.selectionStart;
        const end = field.selectionEnd;

        const value = field.value;

        const selection = value.substring(start, end);


        if (!selection && defaultValue) {
            field.value = manualOnChange(value.substring(0, start)  + defaultValue  + value.substring(end));
        } else {
            before = before.replaceAll("$SELECTION", selection);
            after = after.replaceAll("$SELECTION", selection);
            const replacement = `${before}${selection}${after}`;

            manualOnChange(value.substring(0, start) + replacement + value.substring(end));
        }

        field.selectionStart = start + before.length;
        field.selectionEnd = end + before.length;
        field.focus();
    }

    if (show) {
        return (
            <div className="markdown-editor-buttons" {...props}>
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
                    onClick={() => wrapSelection("**", "**", "**bold text**")}
                >
                    Bold
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("_", "_", "_italic text_")}
                >
                    Italic
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("~", "~", "~strikethrough text~")}
                >
                    Strikethrough
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("$", "$", "$x^2$")}
                >
                    Math
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection("[", "](https://google.com)", "[Link Text](https://google.com)")}
                >
                    Link
                </BootstrapButton>
            </div>
        );
    } else {
        return (
            <div className="markdown-editor-buttons" {...props}>
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