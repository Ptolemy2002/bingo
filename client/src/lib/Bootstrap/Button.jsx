import { combineClassNames } from "src/lib/Misc";

export default function BootstrapButton({
    onClick,
    type = "primary",
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
            outline ? `btn-outline-${type}` : `btn-${type}`
        ),
        type: "button",
        disabled,
        onClick
    };

    return (
        <button {...newProps}>{children}</button>
    );
}