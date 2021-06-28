/** React imports */
import React, { FC, useLayoutEffect, useRef } from "react";

/** Hook imports */
import { useLayoutValue, useProperties } from "../zhooks";
/** Other imports */
import BaseComponent from "../BaseComponent";
import {getFont, getAlignments, translateTextAlign} from "../compprops";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";

/**
 * Displays a simple label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UILabel: FC<BaseComponent> = (baseProps) => {
    /** Reference for label element */
    const labelRef = useRef<HTMLSpanElement>(null);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Alignments for label */
    const lblAlignments = getAlignments(props);
    const lblTextAlignment = translateTextAlign(props.horizontalAlignment);
    /** Font for label */
    const lblFont = getFont(props.font);
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(labelRef.current && onLoadCallback) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useLayoutEffect(() => {
        if(labelRef.current && onLoadCallback) {
            const resizeObserver = new ResizeObserver(entries => {
                sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback)
            });

            resizeObserver.observe(labelRef.current);
            
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [labelRef.current, onLoadCallback]);

    /** DangerouslySetInnerHTML because a label should display HTML tags as well e.g. <b> label gets bold */
    return(
        <span
            id={props.name}
            className={"rc-label" + ((props.text as string).includes("<html>") ? " rc-label-html" : "")}
            style={{
                justifyContent: lblAlignments.ha,
                alignItems: lblAlignments.va,
                backgroundColor: props.background,
                color: props.foreground,
                ...lblTextAlignment,
                ...lblFont,
                ...layoutStyle
            }}>
            <span ref={labelRef} dangerouslySetInnerHTML={{ __html: props.text as string }} />
        </span>
    )
}
export default UILabel