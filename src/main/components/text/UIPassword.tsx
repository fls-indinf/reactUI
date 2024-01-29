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
import { Password } from "primereact/password";
import {  handleFocusGained, onFocusLost } from "../../util/server-util/FocusUtil";
import { ITextField } from "./UIText";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../util/component-util/IsCompDisabled";
import { sendSetValue } from "../../util/server-util/SendSetValues";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { handleEnterKey } from "../../util/other-util/HandleEnterKey";
import { getTabIndex } from "../../util/component-util/GetTabIndex";
import { IExtendableText } from "../../extend-components/text/ExtendText";
import useRequestFocus from "../../hooks/event-hooks/useRequestFocus";

/**
 * This component displays an input field of password type not linked to a databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIPassword: FC<ITextField & IExtendableText> = (props) => {
    /** Current state of password value */
    const [pwValue, setPwValue] = useState(props.text || "");

    /** True, if the user has changed the value */
    const startedEditing = useRef<boolean>(false);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    useRequestFocus(id, props.requestFocus, props.forwardedRef.current, props.context);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && props.forwardedRef.current){
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.forwardedRef.current]);

    return (
        <Password
            inputRef={props.forwardedRef}
            id={props.name}
            className={concatClassnames(
                "rc-input", 
                props.focusable === false ? "no-focus-rect" : "",
                isCompDisabled(props) ? "rc-input-readonly" : "",
                props.styleClassNames
            )}
            value={pwValue||""} 
            feedback={false} 
            style={{...props.layoutStyle, ...props.compStyle}} 
            onChange={event => {
                startedEditing.current = true;
                if (props.onChange) {
                    props.onChange({ originalEvent: event, value: event.currentTarget.value });
                }
                
                setPwValue(event.currentTarget.value)
            }} 
            onFocus={(event) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.name, props.context)}
            onBlur={(event) => {
                if (!isCompDisabled(props)) {
                    if (props.onBlur) {
                        props.onBlur(event);
                    }

                    if (startedEditing.current) {
                        sendSetValue(props.name, pwValue, props.context.server, props.topbar);
                        startedEditing.current = false;
                    }
    
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, props.context.server)
                    }
                }
            }}
            tooltip={props.toolTipText}
            tooltipOptions={{ position: "left" }}
            {...usePopupMenu(props)}
            size={props.columns !== undefined && props.columns >= 0 ? props.columns : 15}
            onKeyDown={(e) => handleEnterKey(e, e.target, props.name)}
            disabled={isCompDisabled(props)}
            tabIndex={getTabIndex(props.focusable, props.tabIndex)} />
    )
}
export default UIPassword