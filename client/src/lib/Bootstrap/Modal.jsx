import { memo } from "react";
import { combineClassNames, clamp } from "src/lib/Misc";
import BootstrapButton from "src/lib/Bootstrap/Button";

const BootstrapModal = memo(function({
    id,
    children,
    className,
    ...props
}={}) {
    const newProps = {
        ...props,
        id,
        className: combineClassNames(
            className,
            "modal"
        ),
        tabIndex: "-1",
        role: "dialog",
    };

    return (
        <div {...newProps}>
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    )
});
export default BootstrapModal;

export const BootstrapModalHeader = memo(function({
    hLevel = 5,
    children,
    className,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "modal-header"
        )
    };

    const HTag = `h${clamp(hLevel, 1, 6)}`;
    return (
        <div {...newProps}>
            <HTag className="modal-title">
                {children}
            </HTag>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
        </div>
    );
});

export const BootstrapModalBody = memo(function({
    children,
    className,
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "modal-body"
        )
    };

    return (
        <div {...newProps}>
            {children}
        </div>
    );
});

export const BootstrapModalFooter = memo(function({
    children,
    className,
    cancelProps = {},
    cancelText = "Cancel",
    ...props
}={}) {
    const newProps = {
        ...props,
        className: combineClassNames(
            className,
            "modal-footer"
        )
    };

    return (
        <div {...newProps}>
            {children}
            <BootstrapButton
                {...cancelProps}
                data-bs-dismiss="modal"
            >
                {cancelText}
            </BootstrapButton>
        </div>
    );
});

export const BootstrapModalActivateButton = memo(function(
    {
        modalId,
        children,
        ...props
    }
) {
    const newProps = {
        ...props,
        "data-bs-toggle": "modal",
        "data-bs-target": `#${modalId}`,
    };



    return (
        <BootstrapButton {...newProps}>
            {children}
        </BootstrapButton>
    );
});

BootstrapModal.Header = BootstrapModalHeader;
BootstrapModal.Body = BootstrapModalBody;
BootstrapModal.Footer = BootstrapModalFooter;
BootstrapModal.ActivateButton = BootstrapModalActivateButton;
