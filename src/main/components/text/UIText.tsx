/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useLayoutEffect, useRef, useState } from "react";
import { InputText } from "primereact/inputtext";
import { useComponentConstants, useMouseListener, usePopupMenu } from "../../hooks";
import BaseComponent from "../../util/types/BaseComponent";
import {parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, checkComponentName, handleEnterKey, sendSetValue, isCompDisabled, getTabIndex, concatClassnames} from "../../util";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";

export interface ITextField extends BaseComponent {
    columns?:number
    editable?:boolean
}

/**
 * This component displays an input field not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIText: FC<ITextField> = (baseProps) => {
    /** Reference for the input field */
    const inputRef = useRef<any>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle,, compStyle] = useComponentConstants<ITextField>(baseProps);

    /** Current state of the text value */
    const [text, setText] = useState(props.text || "");

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, inputRef.current ? inputRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize])

    return (
        <InputText 
            ref={inputRef} 
            id={checkComponentName(props.name)}
            className={concatClassnames(
                "rc-input", 
                props.focusable === false ? "no-focus-rect" : "",
                isCompDisabled(props) ? "rc-input-readonly" : "",
                props.style
            )}
            value={text||""} 
            style={{...layoutStyle, ...compStyle}} 
            onChange={event => setText(event.currentTarget.value)}
            onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
            onBlur={() => {
                if (!isCompDisabled(props)) {
                    sendSetValue(props.name, text, context.server, lastValue.current, topbar);
                    lastValue.current = text;
    
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, context.server)
                    }
                }
            }}
            tooltip={props.toolTipText}
            tooltipOptions={{ position: "left" }}
            {...usePopupMenu(props)}
            size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15}
            onKeyDown={(e) => handleEnterKey(e, e.target, props.name)}
            readOnly={isCompDisabled(props)}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)}
        />
    )
}
export default UIText