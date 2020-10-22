import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import tinycolor from 'tinycolor2';
import {ToggleButton} from 'primereact/togglebutton';
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import {IButton} from "../IButton";
import {addHoverEffect, buttonProps, styleButton, styleChildren} from "../ButtonStyling";

type ToggleButtonEvent = {
    originalEvent: Event,
    value: boolean,
    target: {
        type: string,
        name: string,
        id: string,
        value: boolean
    }
}

const UIToggleButton: FC<IButton> = (baseProps) => {

    const buttonRef = useRef<HTMLSpanElement>(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IButton>(baseProps.id, baseProps);
    const btnData = buttonProps(props);
    const {onLoadCallback, id} = baseProps;

    const [checked, setChecked] = useState<boolean>(false);
    const [bgd, setBgd] = useState<string|undefined>(btnData.style.backgroundColor);
    const btnBgdChecked = props.background ? tinycolor(props.background).darken(5).toString() : tinycolor("#007ad9").darken(10).toString();

    useLayoutEffect(() => {
        const btnRef = buttonRef.current;
        if (btnRef) {
            styleButton(btnRef.children[0] as HTMLElement, props);
            styleChildren(btnRef.children[0].children, props, btnData, layoutValue.get(props.id));
            addHoverEffect(btnRef.children[0] as HTMLElement, btnData.style.backgroundColor, btnBgdChecked, 5, props, btnData.btnBorderPainted, checked);
            if (onLoadCallback) {
                const size:DOMRect = btnRef.getBoundingClientRect();
                onLoadCallback(id, size.height, size.width);
            }
        }
    },[onLoadCallback, id, checked])

    const handleOnChange = (event:ToggleButtonEvent) => {
        const req = createPressButtonRequest();
        req.componentId = props.name;
        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
        setChecked(event.value);
        setBgd(event.value ? btnBgdChecked : btnData.style.backgroundColor)
    }

    return (
        <span ref={buttonRef} style={{position: 'absolute', ...layoutValue.get(props.id)}}>
            <ToggleButton
                style={{...btnData.style, backgroundColor: bgd, borderColor: bgd}}
                offLabel={props.text}
                onLabel={props.text}
                offIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                onIcon={btnData.iconProps ? btnData.iconProps.icon : undefined}
                iconPos={btnData.iconPos}
                tabIndex={btnData.tabIndex as number}
                checked={checked}
                onChange={event => handleOnChange(event)}
            />
        </span>
    )
}
export default UIToggleButton