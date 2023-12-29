import { combineClassNames, clamp } from "src/lib/Misc";
import BootstrapButton from "src/lib/Bootstrap/Button";

export default function BootstrapModal({
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
}

export function BootstrapModalHeader({
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
}

export function BootstrapModalBody({
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
}

export function BootstrapModalFooter({
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
}

export function BootstrapModalActivateButton(
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
}

BootstrapModal.Header = BootstrapModalHeader;
BootstrapModal.Body = BootstrapModalBody;
BootstrapModal.Footer = BootstrapModalFooter;
BootstrapModal.ActivateButton = BootstrapModalActivateButton;
