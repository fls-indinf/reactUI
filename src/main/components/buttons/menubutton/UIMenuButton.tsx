/** React imports */
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { SplitButton } from "primereact/splitbutton";
import tinycolor from 'tinycolor2';

/** Hook imports */
import { useButtonStyling, useComponentConstants, useEventHandler, useMouseListener } from "../../zhooks";

/** Other imports */
import { createPressButtonRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { IButton } from "..";
import { parseIconData } from "../../compprops";
import { concatClassnames, sendOnLoadCallback, parsePrefSize, parseMinSize, parseMaxSize, getFocusComponent } from "../../util";
import BaseComponent from "../../BaseComponent";
import { showTopBar } from "../../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/SendFocusRequests";

/** Interface for MenuButton */
export interface IMenuButton extends IButton {
    popupMenu: string;
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

    /** Component constants for contexts, properties and style */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<IMenuButton>(baseProps);

    /** Style properties for the button */
    const btnStyle = useButtonStyling(props, layoutStyle);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Current state of the menuitems */
    const [items, setItems] = useState<Array<any>>();

    /** Hook for MouseListener */
    useMouseListener(props.name, buttonWrapperRef.current ? buttonWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = buttonWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(id, props.className, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), wrapperRef, onLoadCallback);
        }
    }, [onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useLayoutEffect(() => {
        //TODO: Maybe it'll be possible to change the tabindex of the menubutton without dom manipulation in PrimeReact
        if (buttonRef.current) {
            (document.getElementsByClassName("p-splitbutton-menubutton")[0] as HTMLElement).setAttribute("tabindex", "-1");
        }
    },[])

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
                        showTopBar(context.server.sendRequest(req, REQUEST_ENDPOINTS.PRESS_BUTTON), topbar);
                    }
                });
            });
            setItems(tempItems);
        }
        if(props.popupMenu) {
            buildMenu(context.contentStore.getChildren(props.popupMenu, props.className));
        }
    },[context.contentStore, context.server, props])

    useEventHandler(buttonWrapperRef.current ? buttonRef.current.defaultButton : undefined, "click", (e) => (e.target as HTMLElement).focus());
    useEventHandler(buttonWrapperRef.current ? buttonWrapperRef.current.querySelector(".p-splitbutton-menubutton") as HTMLElement : undefined, "click", (e) => (e.target as HTMLElement).focus());
    useEventHandler(buttonRef.current ? buttonRef.current.defaultButton : undefined, "blur", (e) => {
        const castedEvent = e as FocusEvent;
        if (castedEvent.relatedTarget === buttonWrapperRef.current) {
            getFocusComponent(props.name + "-wrapper", false)?.focus();
        }
    })

    return (
        <span
            className="rc-popupmenubutton-wrapper"
            id={props.name + "-wrapper"}
            ref={buttonWrapperRef} 
            style={{position: 'absolute', ...layoutStyle}}
            aria-label={props.ariaLabel}
            onFocus={(e) => {
                if (props.eventFocusGained) {
                    onFocusGained(props.name, context.server)
                }
                const defaultButton = (e.target.querySelector(".p-splitbutton-defaultbutton") as HTMLElement)
                if (defaultButton) {
                    (e.target.querySelector(".p-splitbutton-defaultbutton") as HTMLElement).focus();
                }
            }}
            onBlur={props.eventFocusLost ? () => onFocusLost(props.name, context.server) : undefined}
            tabIndex={btnStyle.tabIndex}
        >
            <SplitButton
                ref={buttonRef}
                id={props.name}
                className={concatClassnames(
                    "rc-popupmenubutton",
                    props.borderPainted === false ? "border-notpainted" : '',
                    btnStyle.borderPainted && tinycolor(btnStyle.style.background?.toString()).isDark() ? "bright" : "dark",
                    `gap-${btnStyle.iconGapPos}`
                )}
                style={{
                    ...btnStyle.style, 
                    padding: '0',
                    background: undefined,
                    borderColor: undefined,
                    '--menuBtnJustify': btnStyle.style.justifyContent,
                    '--menuBtnAlign': btnStyle.style.alignItems,
                    '--menuBtnPadding': btnStyle.style.padding,
                    '--background': btnStyle.style.background,
                    '--hoverBackground': tinycolor(btnStyle.style.background?.toString()).darken(5).toString(),
                    ...(btnStyle.iconProps?.icon ? {
                        '--iconWidth': `${btnStyle.iconProps.size?.width}px`,
                        '--iconHeight': `${btnStyle.iconProps.size?.height}px`,
                        '--iconColor': btnStyle.iconProps.color,
                        '--iconImage': `url(${context.server.RESOURCE_URL + btnStyle.iconProps.icon})`,
                        '--iconTextGap': `${props.imageTextGap || 4}px`,
                    } : {})
                }}
                label={props.text}
                icon={btnStyle.iconProps ? concatClassnames(btnStyle.iconProps.icon, 'rc-button-icon') : undefined}
                disabled={props.enabled === false}
                tabIndex={-1}
                model={items}
                onClick={() => buttonRef.current.show()}
                tooltip={props.toolTipText} />
        </span>
    )
}
export default UIMenuButton