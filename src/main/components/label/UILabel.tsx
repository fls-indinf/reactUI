/** React imports */
import React, { FC, useContext, useLayoutEffect, useRef } from "react";

/** Hook imports */
import { useProperties } from "../zhooks";
/** Other imports */
import BaseComponent from "../BaseComponent";
import { LayoutContext } from "../../LayoutContext";
import {getFont, getAlignments} from "../compprops";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback} from "../util";

/**
 * Displays a simple label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UILabel: FC<BaseComponent> = (baseProps) => {
    /** Reference for label element */
    const labelRef = useRef<HTMLSpanElement>(null);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Alignments for label */
    const lblAlignments = getAlignments(props);
    /** Font for label */
    const lblFont = getFont(props.font);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(labelRef.current && onLoadCallback) {
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), labelRef.current, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** DangerouslySetInnerHTML because a label should display HTML tags as well e.g. <b> label gets bold */
    return(
        <span
            id={props.id}
            ref={labelRef}
            dangerouslySetInnerHTML={{ __html: props.text as string }}
            className={"rc-label" + ((props.text as string).includes("<html>") ? " rc-label-html" : "")}
            style={layoutValue.get(props.id) ?
                {
                    justifyContent: lblAlignments.ha,
                    alignItems: lblAlignments.va,
                    backgroundColor: props.background,
                    color: props.foreground,
                    ...lblFont,
                    ...layoutValue.get(props.id)
                } : {
                    justifyContent: lblAlignments.ha,
                    alignContent: lblAlignments.va,
                    backgroundColor: props.background,
                    color: props.foreground,
                    ...lblFont,
                }} />
    )
}
export default UILabel