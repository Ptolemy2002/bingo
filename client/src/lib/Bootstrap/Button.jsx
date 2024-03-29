import { memo } from "react";
import { combineClassNames } from "src/lib/Misc";
import { Link } from "react-router-dom";

export default memo(function BootstrapButton({
    onClick,
    type = "primary",
    className = null,
    disabled = false,
    outline = false,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "btn",
            outline ? `btn-outline-${type}` : `btn-${type}`
        ),
        type: "button",
        disabled,
        onClick
    };

    return (
        <button {...newProps}>{children}</button>
    );
});

export const BootstrapButtonLink = memo(function({
    to,
    type = "primary",
    className = null,
    disabled = false,
    outline = false,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "btn",
            outline ? `btn-outline-${type}` : `btn-${type}`
        ),
        type: "button",
        disabled,
        to
    };

    return (
        <Link {...newProps}>{children}</Link>
    );
});