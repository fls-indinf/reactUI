import React, { FC, useLayoutEffect, useRef } from "react";
import { Tooltip } from 'primereact/tooltip';
import { useMouseListener, usePopupMenu, useComponentConstants } from "../../hooks";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import BaseComponent from "../../util/types/BaseComponent";
import { checkComponentName, getTabIndex, parseMaxSize, parseMinSize, parsePrefSize, sendOnLoadCallback } from "../../util";

// Interface for the browser component
export interface IBrowser extends BaseComponent {
    url: string;
}

/**
 * This component displays an iframe which displays an url
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIBrowser: FC<IBrowser> = (baseProps) => {
    /** Reference for the browser element */
    const browserRef = useRef<any>(null);

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle, translation, compStyle] = useComponentConstants<IBrowser>(baseProps);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, browserRef.current ? browserRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = browserRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={browserRef} style={layoutStyle}>
            <Tooltip target={"#" + checkComponentName(props.name)} />
            <iframe
                id={checkComponentName(props.name)} 
                className="rc-mobile-browser"
                style={{...compStyle}}
                src={props.url}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                data-pr-tooltip={props.toolTipText}
                data-pr-position="left"
                {...usePopupMenu(props)}
                tabIndex={getTabIndex(props.focusable, props.tabIndex)}
            />
        </span>
    )
}
export default UIBrowser