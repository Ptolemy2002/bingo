import { combineClassNames } from "src/lib/Misc";

export function BootstrapButton({
    onClick,
    variant = "primary",
    className = null,
    disabled = false,
    outline = false,
    children,
    ...props
}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "btn",
            outline ? `btn-outline-${variant}` : `btn-${variant}`
        ),
        type: "button",
        disabled,
        onClick
    };

    return (
        <button {...newProps}>{children}</button>
    );
}