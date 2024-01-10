import BootstrapBadge from "src/lib/Bootstrap/Badge";
import { combineClassNames } from "src/lib/Misc";

const customTags = [
    "basically-free",
    "common",
    "uncommon",
    "rare",
    "legendary",
];

const lightTags = [
    "basically-free",
    "uncommon",
    "rare",
];

export default function TagBadge({
    tag,
    className,
    ...props
}={}) {
    const newProps = {
        ...props,
        type: customTags.includes(tag) ? tag : "primary",
        className: combineClassNames(
            className,
            customTags.includes(tag) && lightTags.includes(tag) ? "text-dark" : null,
            tag === "basically-free" ? "border border-dark" : null
        )
    };

    return (
        <BootstrapBadge {...newProps}>
            {tag}
        </BootstrapBadge>
    );
}