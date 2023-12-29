import React from "react";
import { combineClassNames, clamp } from "src/lib/Misc";

export default function BootstrapCard({
    className = null,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card")
    };

    return (
        <div {...newProps}>
            {children}
        </div>
    );
}

export function BootstrapCardBody({
    className = null,
    children,
    ...props

}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card-body")
    };

    return (
        <div {...newProps}>
            {children}
        </div>
    );
}

export function BootstrapCardTitle({
    className = null,
    hLevel = 5,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card-title")
    };

    const HTag = `h${clamp(hLevel, 1, 6)}`;
    return (
        <HTag {...newProps}>
            {children}
        </HTag>
    );
}

export function BootstapCardSubtitle({
    className = null,
    hLevel = 6,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card-subtitle"),
    };

    const HTag = `h${clamp(hLevel, 1, 6)}`;
    return (
        <HTag {...newProps}>
            {children}
        </HTag>
    );
}

export function BootstrapCardText({
    className = null,
    children,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card-text")
    };

    return (
        <div {...newProps}>
            {children}
        </div>
    );
}

export function BootstrapCardImage({
    className = null,
    position = "top",
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "card-img-" + position),
    };

    // alt text will likely be provided in the props, so I'm dismissing the eslint warning
    return (
        <img {...newProps} /> // eslint-disable-line jsx-a11y/alt-text
    );
}

// This is done so that we can import only the BootstrapCard component and still have access to the other related components
BootstrapCard.Body = BootstrapCardBody;
BootstrapCard.Title = BootstrapCardTitle;
BootstrapCard.Subtitle = BootstapCardSubtitle;
BootstrapCard.Text = BootstrapCardText;
BootstrapCard.Image = BootstrapCardImage;