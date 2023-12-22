import React from "react";
import { combineClassNames } from "src/lib/Misc";

export default function BootstrapCard(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card")
    };

    return (
        <div {...newProps}>
            {props.children}
        </div>
    );
}

export function BootstrapCardBody(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-body")
    };

    return (
        <div {...newProps}>
            {props.children}
        </div>
    );
}

export function BootstrapCardTitle(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-title")
    };

    // Delete props will be handled by us, not passed to the <h> tag
    delete newProps.hLevel;

    // For some reason, eslint doesn't recognize that hTag is used in the return statement. Also, the first letter has to be capitalized for react to recognize it as a component
    const HTag = `h${props.hLevel || 5}`; //eslint-disable-line no-unused-vars
    return (
        <HTag {...newProps}>
            {props.children}
        </HTag>
    );
}

export function BootstapCardSubtitle(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-subtitle"),
    };

    // Delete props will be handled by us, not passed to the <h> tag
    delete newProps.hLevel;

    // For some reason, eslint doesn't recognize that HTag is used in the return statement. Also, the first letter has to be capitalized for react to recognize it as a component
    const HTag = `h${props.hLevel || 6}`; //eslint-disable-line no-unused-vars
    return (
        <HTag {...newProps}>
            {props.children}
        </HTag>
    );
}

export function BootstrapCardText(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-text")
    };

    return (
        <p {...newProps}>
            {props.children}
        </p>
    );
}

export function BootstrapCardImage(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "card-img-" + props.position),
    };

    // Delete props will be handled by us, not passed to the <img> tag
    delete newProps.position;

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