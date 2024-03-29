import React, { useRef, useState, memo } from "react";
import { combineClassNames, useMountEffect, clamp } from "src/lib/Misc";
import { Link } from "react-router-dom";

export default function BootstrapAlert({
    type = "primary",
    allowDismiss = false,
    transitionDuration = 500,
    className = null,
    children,
    ...props
}={}) {
    const alert = useRef(null);
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
            className,
            "alert", `alert-${type}`,
            allowDismiss ? "alert-dismissible fade show" : null,
            shown ? null : "d-none"
        ),
        role: "alert"
    };

    return (
        <div {...newProps} ref={alert}>
            {children}
            {
                allowDismiss ? (
                    <button className="btn-close" type="button" aria-label="Close" onClick={hide}></button>
                ) : null
            }
        </div>
    );
}

export const BootstrapAlertHeading = memo(function({
    hLevel = 4,
    className = null,
    children,
    ...props

}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "alert-heading")
    };

    const HTag = `h${clamp(hLevel, 1, 6)}`;
    return (
        <HTag {...newProps}>
            {children}
        </HTag>
    );
});

export const BootstrapAlertLink = memo(function({
    className = null,
    children,
    ...props

}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(className, "alert-link")
    };

    return (
        <Link {...newProps}>
            {children}
        </Link>
    );
});

// This is done so that we can import only the BootstrapAlert component and still have access to the other related components
BootstrapAlert.Heading = BootstrapAlertHeading;
BootstrapAlert.Link = BootstrapAlertLink;