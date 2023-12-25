import Markdown from "react-markdown";
import { Link } from "react-router-dom";

export function MarkdownLink({ node, href, children, ...props }) {
    return (
        <Link to={href} {...props}>{children}</Link>
    );
}

export default function MarkdownRenderer({ children }) {
    return (
        <Markdown
            components={{
                a: MarkdownLink
            }}
        >
            {children}
        </Markdown>
    );
}