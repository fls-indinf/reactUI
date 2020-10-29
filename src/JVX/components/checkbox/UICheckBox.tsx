import React, {FC, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";
import {Checkbox} from 'primereact/checkbox';
import {jvxContext} from "../../jvxProvider";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import {IButton} from "../buttons/IButton";
import {buttonProps, styleButton, styleChildren} from "../buttons/ButtonStyling";
import {createSetValueRequest} from "src/JVX/factories/RequestFactory";
import REQUEST_ENDPOINTS from "src/JVX/request/REQUEST_ENDPOINTS";

export interface ICheckBox extends IButton {
    selected?: boolean;
}

const UICheckBox: FC<ICheckBox> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<ICheckBox>(baseProps.id, baseProps);
    const btnData = buttonProps(props);
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0] as HTMLElement, props);
            styleChildren(btnRef.children[0].children, props, btnData, layoutValue.get(props.id), context.server.RESOURCE_URL);
            if (onLoadCallback) {
                const size: DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    }, [onLoadCallback, id]);

    return (
        <span ref={buttonRef} style={layoutValue.get(props.id) ? layoutValue.get(props.id) : {position: "absolute"}}>
            <span style={btnData.style}>
                <Checkbox
                    inputId={props.id}
                    style={{order: btnData.iconPos === 'left' ? 1 : 2}}
                    checked={props.selected}
                    onChange={() => {
                        let checked = props.selected === undefined ? true : !props.selected;
                        const req = createSetValueRequest();
                        req.componentId = props.name;
                        req.value = checked;
                        context.server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUE);
                    }}
                />
                <label className="p-radiobutton-label" htmlFor={props.id} style={{order: btnData.iconPos === 'left' ? 2 : 1}}>
                    {btnData.iconProps.icon !== undefined &&
                        //@ts-ignore
                        <i className={btnData.iconProps.icon} style={{height:btnData.iconProps.size.height, width: btnData.iconProps.size.width, color: btnData.iconProps.color, marginRight: '4px'}}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UICheckBox