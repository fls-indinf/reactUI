/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef } from "react";

/** 3rd Party imports */
import { RadioButton } from 'primereact/radiobutton';
import tinycolor from 'tinycolor2';

/** Hook imports */
import { useLayoutValue, useMouseListener, useProperties } from "../../zhooks";

/** Other imports */
import { appContext } from "../../../AppProvider";
import { buttonProps, getGapPos, getIconCenterDirection, IButtonSelectable } from "..";
import { createSetValueRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize} from "../../util";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

/**
 * This component displays a RadioButton and its label
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIRadioButton: FC<IButtonSelectable> = (baseProps) => {
    /** Reference for the RadioButton element */
    const rbRef = useRef<any>(null)
    /** Reference for label element of RadioButton */
    const labelRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IButtonSelectable>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const rbBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--standardBgdColor');
    /** Server set or default horizontal alignment */
    const rbHAlign = btnData.style.justifyContent || (props.horizontalTextPosition !== 1 ? 'flex-start' : 'center');
    /** Server set or default vertical alignment */
    const rbVAlign = btnData.style.alignItems || (props.horizontalTextPosition !== 1 ? 'center' : 'flex-start');
    /** On which side of the side of the label, the gap between icon and label should be */
    const gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);
    /** The amount of pixels to center the icon or radiobutton/checkbox respective to the label is hTextPos = 1 */
    const iconCenterGap = rbRef.current && labelRef.current ? labelRef.current.offsetWidth/2 - rbRef.current.element.offsetWidth/2 : 0;
    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span ref={buttonWrapperRef} style={layoutStyle}>
            <span
                id={props.name}
                aria-label={props.ariaLabel}
                className={concatClassnames(
                    "rc-radiobutton",
                    `gap-${gapPos}`,
                    getIconCenterDirection(props.horizontalTextPosition, props.horizontalAlignment),
                    props.style?.includes("actiongroup") ? "radio-action-group" : ""
                    )}
                onFocus={props.eventFocusGained ? () => onFocusGained(props.name, context.server) : undefined}
                onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
                style={{
                    ...btnData.style,
                    '--radioJustify': rbHAlign, 
                    '--radioAlign': rbVAlign,
                    '--radioPadding': btnData.style.padding,
                    '--background': rbBgd,
                    '--iconTextGap': `${props.imageTextGap || 4}px`,
                    '--iconCenterGap': `${iconCenterGap}px`,
                    ...(btnData.iconProps?.icon ? {
                        '--iconWidth': `${btnData.iconProps.size?.width}px`,
                        '--iconHeight': `${btnData.iconProps.size?.height}px`,
                        '--iconColor': btnData.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnData.iconProps.icon})`,
                    } : {})
                } as any}>
                <RadioButton
                    ref={rbRef}
                    inputId={props.id}
                    style={{order: btnData.iconPos === 'left' ? 1 : 2}}
                    checked={props.selected}
                    onChange={() => {
                        let checked = props.selected === undefined ? true : !props.selected;
                        const req = createSetValueRequest();
                        req.componentId = props.name;
                        req.value = checked;
                        showTopBar(context.server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUE), topbar);
                    }}
                    tooltip={props.toolTipText}
                />
                <label 
                    ref={labelRef} 
                    className={concatClassnames(
                        "p-radiobutton-label",
                        btnData.style.color ? 'textcolor-set' : '',
                        btnData.btnBorderPainted && tinycolor(rbBgd).isDark() ? "bright" : "dark",
                        props.eventMousePressed ? "mouse-pressed-event" : ""
                        )} 
                    htmlFor={props.id} 
                    style={{order: btnData.iconPos === 'left' ? 2 : 1}}>
                    {btnData.iconProps.icon !== undefined &&
                        <i className={concatClassnames(btnData.iconProps.icon, 'rc-button-icon')}/>
                    }
                    {props.text}
                </label>
            </span>
        </span>
    )
}
export default UIRadioButton