import React, { useRef, useState } from "react";
import { combineClassNames, useMountEffect } from "src/lib/Misc";
import { Link } from "react-router-dom";

export default function BootstrapAlert(props) {
    const alert = useRef(null);
    const transitionDuration = props.transitionDuration || 500;
    const [shown, setShown] = useState(true);

    useMountEffect(() => {
        alert.current.style.transition = `visibility 0s linear ${transitionDuration}ms, opacity ${transitionDuration}ms linear`;
        alert.current.style.opacity = "1";
        alert.current.style.visibility = "visible";
    });

    function hide() {
        alert.current.style.opacity = "0";
        alert.current.style.visibility = "hidden";

        setTimeout(() => {
            setShown(false);
        }, transitionDuration);
    }

    const newProps = {
        ...props,
        className: combineClassNames(
            props.className,
            "alert", `alert-${props.type}`,
            props.allowDismiss ? "alert-dismissible fade show" : null,
            shown ? null : "d-none"
        ),
        role: "alert"
    };
    // Delete props will be handled by us, not passed to the <div> tag
    delete newProps.type;
    delete newProps.allowDismiss;
    delete newProps.transitionDuration;

    return (
        <div {...newProps} ref={alert}>
            {props.children}
            {
                props.allowDismiss ? (
                    <button className="btn-close" type="button" aria-label="Close" onClick={hide}></button>
                ) : null
            }
        </div>
    );
}

export function BootstrapAlertHeading(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "alert-heading")
    };

    // Delete props will be handled by us, not passed to the <h> tag
    delete newProps.hLevel;

    // For some reason, eslint doesn't recognize that hTag is used in the return statement. Also, the first letter has to be capitalized for react to recognize it as a component
    const HTag = `h${props.hLevel || 4}`; //eslint-disable-line no-unused-vars
    return (
        <HTag {...newProps}>
            {props.children}
        </HTag>
    );
}

export function BootstrapAlertLink(props) {
    const newProps = {
        ...props,
        className: combineClassNames(props.className, "alert-link")
    };

    return (
        <Link {...newProps}>
            {props.children}
        </Link>
    );
}

// This is done so that we can import only the BootstrapAlert component and still have access to the other related components
BootstrapAlert.Heading = BootstrapAlertHeading;
BootstrapAlert.Link = BootstrapAlertLink;