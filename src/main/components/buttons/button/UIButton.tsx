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

import React, { CSSProperties, FC,  useLayoutEffect, useMemo, useRef } from "react";
import { Button } from "primereact/button";
import tinycolor from 'tinycolor2';
import useButtonStyling from "../../../hooks/style-hooks/useButtonStyling";
import useButtonMouseImages, { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages";
import usePopupMenu from "../../../hooks/data-hooks/usePopupMenu";
import { createDispatchActionRequest } from "../../../factories/RequestFactory";
import { showTopBar } from "../../topbar/TopBar";
import { handleFocusGained, onFocusLost } from "../../../util/server-util/FocusUtil";
import { IButton } from "../IButton";
import { sendOnLoadCallback } from "../../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../../util/component-util/SizeUtil";
import REQUEST_KEYWORDS from "../../../request/REQUEST_KEYWORDS";
import { concatClassnames } from "../../../util/string-util/ConcatClassnames";
import { isCompDisabled } from "../../../util/component-util/IsCompDisabled";
import { IExtendableButton } from "../../../extend-components/buttons/ExtendButton";
import useRequestFocus from "../../../hooks/event-hooks/useRequestFocus";
import useIsHTMLText from "../../../hooks/components-hooks/useIsHTMLText";
import IBaseComponent from "../../../util/types/IBaseComponent";
import { IComponentConstants } from "../../BaseComponent";
import { IEditorCheckBox } from "../../editors/checkbox/UIEditorCheckbox";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";

export interface IIsHTML {
    isHTML?: boolean
}

interface IButtonRef {
    buttonRef?:any
}

// If the Buttons text contains HTML, render it in a span, because the button on its own isn't able to render HTML.
export const RenderButtonHTML: FC<{ text:string }> = (props) => {
    return (
        <span className="button-html-label" dangerouslySetInnerHTML={{ __html: props.text as string }} />
    )
}

/** Checks if the contentstore is for transfermode full */
export function isCheckboxCellEditor(props: IBaseComponent & IComponentConstants | IEditorCheckBox & IComponentConstants): props is IEditorCheckBox & IComponentConstants {
    return (props as IEditorCheckBox & IComponentConstants).className !== COMPONENT_CLASSNAMES.BUTTON;
}

const UICellButton: FC<IEditorCheckBox & IComponentConstants & IIsHTML & IButtonRef> = (props) => {
    return (
        <span id={props.name} ref={props.forwardedRef} style={props.layoutStyle}>
            <Button 
                className={concatClassnames(
                    "rc-button",
                    //!btnStyle.borderPainted ? "border-notpainted" : "",
                    props.style?.includes("hyperlink") ? "p-button-link" : "",
                    //btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                    //props.borderOnMouseEntered ? "mouse-border" : "",
                    //`gap-${btnStyle.iconGapPos}`,
                    //btnStyle.iconDirection,
                    props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                    //btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                    props.focusable === false ? "no-focus-rect" : "",
                    props.styleClassNames
                )}
                label={!props.isHTML ? props.cellEditor.text ? props.cellEditor.text : props.columnName : undefined}
                aria-label={props.ariaLabel}
                disabled={props.isReadOnly}
                tooltip={props.toolTipText}
                tooltipOptions={{ position: "left" }}
                layoutstyle-wrapper={props.name} >
                {props.isHTML && props.cellEditor.text && <RenderButtonHTML text={props.text} />}
            </Button>
        </span>

    )
}

/**
 * This component displays a basic button
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIButton: FC<IButton & IExtendableButton & IIsHTML & IButtonRef> = (props) => {
    /** Reference for the input element, if the button is an upload button */
    const inputRef = useRef<HTMLInputElement>(null);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, props.buttonRef.current)

    /** Hook to display mouseOverImages and mousePressedImage */
    useButtonMouseImages(btnStyle.iconProps, btnStyle.pressedIconProps, btnStyle.mouseOverIconProps, props.buttonRef.current ? props.buttonRef.current : undefined);

    /** Handles the requestFocus property */
    useRequestFocus(props.id, props.requestFocus, props.buttonRef.current, props.context);

    /** Potential popup menu of a button */
    const popupMenu = usePopupMenu(props);

    /** When the button is clicked, a pressButtonRequest is sent to the server with the buttons name as componentId */
    const onButtonPress = (event:any) => {
        // ReactUI as lib, execute given event
        if (props.onClick) {
            props.onClick(event)
        }

        if (props.eventAction) {
            const req = createDispatchActionRequest();
            req.componentId = props.name;
            req.isUploadButton = props.classNameEventSourceRef === "UploadButton" ? true : undefined
            showTopBar(props.context.server.sendRequest(req, REQUEST_KEYWORDS.PRESS_BUTTON), props.topbar);
        }
    }

    /** Returns the correct Button element to render, hyperlink, "normal" button, uploadbutton */
    const getElementToRender = () => {
        const btnProps = {
            ref: props.buttonRef.current,
            style: {
                ...btnStyle.style,
                background: undefined,
                borderColor: undefined,
                '--btnJustify': btnStyle.style.justifyContent,
                '--btnAlign': btnStyle.style.alignItems,
                '--btnPadding': btnStyle.style.padding ? btnStyle.style.padding : undefined,
                '--background': btnStyle.style.background,
                '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                ...(btnStyle.iconProps?.icon ? {
                    '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                    '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                    '--iconColor': btnStyle.iconProps.color,
                    '--iconImage': `url(${props.context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                    '--iconTextGap': `${props.imageTextGap || 4}px`,
                    '--iconCenterGap': `${btnStyle.iconCenterGap}px`
                } : {})
            } as CSSProperties,
            tabIndex: btnStyle.tabIndex,
            onClick: (event:any) => onButtonPress(event),
            onFocus: (event:any) => handleFocusGained(props.name, props.className, props.eventFocusGained, props.focusable, event, props.id, props.context),
            onBlur: () => {
                if (props.eventFocusLost) {
                    onFocusLost(props.name, props.context.server)
                }
            }
        }

        // If there is an url in props, render a hyperlink button
        if (props.url) {
            return (
                <span className="hyperlink-wrapper">
                    <a
                        {...btnProps}
                        className={concatClassnames(
                            "rc-button",
                            "p-component",
                            "p-button",
                            !btnStyle.borderPainted ? "border-notpainted" : "",
                            props.style?.includes("hyperlink") ? "p-button-link" : "",
                            props.borderOnMouseEntered ? "mouse-border" : "",
                            `gap-${btnStyle.iconGapPos}`,
                            btnStyle.iconDirection,
                            btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                            props.focusable === false ? "no-focus-rect" : "",
                            isCompDisabled(props) ? "hyperlink-disabled" : "",
                            props.styleClassNames
                        )}
                        href={props.url}
                        target={props.target}
                        layoutstyle-wrapper={props.name}
                        aria-label={props.ariaLabel}
                        {...popupMenu}>
                        {props.text}
                    </a>
                </span>

            )
        }
        else {
            return (
                <>
                    <Button
                        {...btnProps}
                        className={concatClassnames(
                            "rc-button",
                            !btnStyle.borderPainted ? "border-notpainted" : "",
                            props.style?.includes("hyperlink") ? "p-button-link" : "",
                            btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright-button" : "dark-button",
                            props.borderOnMouseEntered ? "mouse-border" : "",
                            `gap-${btnStyle.iconGapPos}`,
                            btnStyle.iconDirection,
                            props.parent?.includes("TB") ? "rc-toolbar-button" : "",
                            btnStyle.iconDirection && btnStyle.style.alignItems === "center" ? "no-center-gap" : "",
                            props.focusable === false ? "no-focus-rect" : "",
                            props.styleClassNames
                        )}
                        label={!props.isHTML ? props.text : undefined}
                        aria-label={props.ariaLabel}
                        icon={btnStyle.iconProps ? isFAIcon(btnStyle.iconProps.icon) ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : 'rc-button-icon' : undefined}
                        iconPos={btnStyle.iconPos}
                        disabled={isCompDisabled(props)}
                        tooltip={props.toolTipText}
                        tooltipOptions={{ position: "left" }}
                        layoutstyle-wrapper={props.name}
                        {...popupMenu}>
                        {props.isHTML && props.text && <RenderButtonHTML text={props.text} />}
                    </Button>
                    {props.classNameEventSourceRef === "UploadButton" &&
                        // render an additional invisible input element to open the file dialog and upload files
                        <input
                            id={props.name + "-upload"}
                            type="file"
                            ref={inputRef}
                            style={{ visibility: "hidden", height: "0px", width: "0px" }}
                            onChange={(e) => {
                                if (inputRef.current) {
                                    const formData = new FormData();
                                    formData.set("clientId", sessionStorage.getItem("clientId") || "")
                                    formData.set("fileId", inputRef.current.getAttribute("upload-file-id") as string)
                                    // @ts-ignore
                                    formData.set("data", e.target.files[0])
                                    props.context.server.sendRequest({ upload: true, formData: formData }, REQUEST_KEYWORDS.UPLOAD)
                                }
                            }}
                            upload-file-id="" />
                    }
                </>
            )
        }
    }
    
    return (
        <span id={props.name} ref={props.forwardedRef} style={props.layoutStyle}>
            {getElementToRender()}
        </span>
    )
}

const BaseButton: FC<IBaseComponent & IComponentConstants | IEditorCheckBox & IComponentConstants> = (props) => {
    const btnForwardedRef = useRef<any>(null);

    /** True if the text is HTML */
    const isHTML = useIsHTMLText(isCheckboxCellEditor(props) ? props.cellEditor.text ? props.cellEditor.text : props.columnName : props.text);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = props;

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, props.layoutStyle, props.compStyle, btnForwardedRef.current);

    console.log(btnStyle)
    
    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (props.forwardedRef.current) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), props.forwardedRef.current, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize, props.text, props.designerUpdate, props.forwardedRef.current]);

    return (
        (!isCheckboxCellEditor(props)) ?
        <UIButton {...props} isHTML={isHTML} buttonRef={btnForwardedRef} />
        :
        <UICellButton {...props} isHTML={isHTML} buttonRef={btnForwardedRef} />
    )
}
export default BaseButton;