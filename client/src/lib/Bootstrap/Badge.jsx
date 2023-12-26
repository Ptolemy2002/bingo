import { combineClassNames } from "src/lib/Misc";

const lightBgTypes = [
    "warning",
    "info",
    "light",
];

export default function BootstrapBadge({
    type = "primary",
    pill = false,
    children,
    className,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "badge",
            `bg-${type}`,
            lightBgTypes.includes(type) ? "text-dark" : null,
            pill ? "rounded-pill" : null
        )
    };

    return (
        <span {...newProps}>
            {children}
        </span>
    );
}