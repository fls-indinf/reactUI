/** React imports */
import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";

/** 3rd Party imports */
import {SplitButton} from "primereact/splitbutton";
import tinycolor from 'tinycolor2';

/** Hook imports */
import useProperties from "../../zhooks/useProperties";

/** Other imports */
import {createPressButtonRequest} from "../../../factories/RequestFactory";
import {jvxContext} from "../../../jvxProvider";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import {LayoutContext} from "../../../LayoutContext";
import {IButton} from "../IButton";
import {buttonProps, getGapPos} from "../ButtonStyling";
import { parseIconData } from "../../compprops/ComponentProperties";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import BaseComponent from "../../BaseComponent";
import { parseJVxSize } from "../../util/parseJVxSize";

/** Interface for MenuButton */
export interface IMenuButton extends IButton {
    popupMenu: string;
}

/** Helper method to concatenate class names and filter out falsy values */
export function cn(...classNames: (string | null | undefined)[]) {
    return classNames.filter(Boolean).join(' ');
}

/**
 * This component displays a Button which contains a dropdown menu
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIMenuButton: FC<IMenuButton> = (baseProps) => {
    /** Reference for the button element */
    const buttonRef = useRef<any>(null);
    /** Reference for the span that is wrapping the button containing layout information */
    const buttonWrapperRef = useRef<HTMLSpanElement>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IMenuButton>(baseProps.id, baseProps);
    /** Information on how to display the button, refreshes everytime the props change */
    const btnData = useMemo(() => buttonProps(props), [props]);
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** Button Background either server set or default */
    const btnBgd = btnData.style.background as string || window.getComputedStyle(document.documentElement).getPropertyValue('--btnDefaultBgd');
    /** Server set or default horizontal alignment */
    const btnHAlign = btnData.style.justifyContent || "center";
    /** Server set or default vertical alignment */
    const btnVAlign = btnData.style.alignItems || "center";
    /** Current state of the menuitems */
    const [items, setItems] = useState<Array<any>>();

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), wrapperRef, onLoadCallback)
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** Builds the menuitems and sets the state */
    useEffect(() => {
        const buildMenu = (foundItems:Map<string, BaseComponent>) => {
            let tempItems:Array<any> = [];
            foundItems.forEach(item => {
                let iconProps = parseIconData(props.foreground, item.image);
                tempItems.push({
                    label: item.text,
                    icon: iconProps ? iconProps.icon : undefined,
                    style: {
                        color: iconProps.color
                    },
                    color: iconProps.color,
                    /** When a menubuttonitem is clicked send a pressButtonRequest to the server */
                    command: () => {
                        const req = createPressButtonRequest();
                        req.componentId = item.name;
                        context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON);
                    }
                });
            });
            setItems(tempItems);
        }
        if(props.popupMenu) {
            buildMenu(context.contentStore.getChildren(props.popupMenu));
        }
    },[context.contentStore, context.server, props])
    
    const gapPos = getGapPos(props.horizontalTextPosition, props.verticalTextPosition);

    return (
        <span ref={buttonWrapperRef} style={{position: 'absolute', ...layoutValue.get(props.id)}}>
            <SplitButton
                ref={buttonRef}
                className={cn(
                    "rc-popupmenubutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnData.btnBorderPainted && tinycolor(btnBgd).isDark() ? "bright" : "dark",
                    `gap-${gapPos}`
                )}
                style={{
                    ...btnData.style, 
                    padding: '0',
                    background: undefined,
                    borderColor: undefined,
                    '--menuBtnJustify': btnHAlign,
                    '--menuBtnAlign': btnVAlign,
                    '--menuBtnPadding': btnData.style.padding,
                    '--background': btnBgd,
                    '--hoverBackground': tinycolor(btnBgd).darken(5).toString(),
                    ...(btnData.iconProps?.icon ? {
                        '--iconWidth': `${btnData.iconProps.size?.width}px`,
                        '--iconHeight': `${btnData.iconProps.size?.height}px`,
                        '--iconColor': btnData.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnData.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                    } : {})
                }}
                label={props.text}
                icon={btnData.iconProps ? cn(btnData.iconProps.icon, 'rc-button-icon') : undefined}
                tabIndex={btnData.tabIndex}
                model={items}
                //@ts-ignore
                onClick={() => buttonRef.current.show()} />
        </span>
    )
}
export default UIMenuButton