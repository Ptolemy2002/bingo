import React, { useState } from "react";
import Markdown from "react-markdown";
import { Link } from "react-router-dom";
import BootstrapButton from "./Bootstrap/Button";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { combineClassNames, clamp } from "src/lib/Misc";
import { wrapSelection } from "src/lib/Form";

export function MarkdownLink({ node, href, children, ...props }={}) {
    return (
        <Link to={href} {...props} target="_blank" rel="noopener noreferrer">{children}</Link>
    );
}

export default function MarkdownRenderer({ baseHLevel=1, children, ...props }={}) {
    const hLevelOverride = {};
    baseHLevel = clamp(baseHLevel, 1, 6);

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
                    onClick={() => wrapSelection(elementRef.current, "**", "**", "**bold text**", [2, -2])}
                >
                    Bold
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection(elementRef.current.current, "_", "_", "_italic text_", [1, -1])}
                >
                    Italic
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection(elementRef.current, "~", "~", "~strikethrough text~", [1, -1])}
                >
                    Strikethrough
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection(elementRef.current, "$", "$", "$x^2$", [1, -1])}
                >
                    Math
                </BootstrapButton>

                <BootstrapButton
                    type="secondary"
                    outline={true}
                    onClick={() => wrapSelection(elementRef.current, "[", "](https://google.com)", "[Link Text](https://google.com)", [1, -21])}
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

export const MarkdownKeyboardShortcuts = [
    {
        modifiers: ["ctrl"],
        key: "b",
        fn: (e) => {
            wrapSelection(e.target, "**", "**", "**bold text**", [2, -2]);
        }
    },

    {
        modifiers: ["ctrl"],
        key: "i",
        fn: (e) => {
            wrapSelection(e.target, "_", "_", "_italic text_", [1, -1]);
        }
    },

    {
        modifiers: ["ctrl"],
        key: "s",
        fn: (e) => {
            wrapSelection(e.target, "~", "~", "~strikethrough text~", [1, -1]);
        }
    },

    {
        modifiers: ["ctrl"],
        key: "m",
        fn: (e) => {
            wrapSelection(e.target, "$", "$", "$x^2$", [1, -1]);
        }
    },

    {
        modifiers: ["ctrl"],
        key: "l",
        fn: (e) => {
            wrapSelection(e.target, "[", "](https://google.com)", "[Link Text](https://google.com)", [1, -21]);
        }
    }
]