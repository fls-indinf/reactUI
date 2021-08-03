/** React imports */
import React, { FC, useContext, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { InputTextarea } from "primereact/inputtextarea";

/** Hook imports */
import { useLayoutValue, useMouseListener, useProperties } from "../zhooks";

/** Other imports */
import BaseComponent from "../BaseComponent";
import { parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback } from "../util";
import { appContext } from "../../AppProvider";
import { showTopBar, TopBarContext } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../util/SendFocusRequests";

/**
 * This component displays a textarea not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITextArea: FC<BaseComponent> = (baseProps) => {
    /** Reference for the textarea */
    const inputRef = useRef<any>(null);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);
    /** Current state of the textarea value */
    const [text, setText] = useState(props.text);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Hook for MouseListener */
    useMouseListener(props.name, inputRef.current ? inputRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputTextarea 
            ref={inputRef} 
            id={props.name} 
            value={text||""} 
            style={{...layoutStyle, resize: 'none'}} 
            onChange={event => setText(event.currentTarget.value)} 
            onFocus={props.eventFocusGained ? () => showTopBar(onFocusGained(props.name, context.server), topbar) : undefined}
            onBlur={props.eventFocusLost ? () => showTopBar(onFocusLost(props.name, context.server), topbar) : undefined} />
    )
}
export default UITextArea