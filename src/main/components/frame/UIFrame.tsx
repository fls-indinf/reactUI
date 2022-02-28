import React, { CSSProperties, FC, useCallback, useMemo, useState } from "react";
import { createDispatchActionRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS_V2 } from "../../request/v2";
import { IWindow } from "../launcher/UIMobileLauncher";
import { Layout } from "../layouts";
import UIMenuBar from "../menubar/UIMenuBar";
import UIToolbar from "../toolbar/UIToolbar";
import { showTopBar } from "../topbar/TopBar";
import { Dimension, panelGetStyle, parseMaxSize, parseMinSize, parsePrefSize } from "../util";
import { useComponents, useConstants } from "../zhooks";

export interface IFrame extends IWindow {
    frameStyle?: CSSProperties,
    internal?: boolean
    sizeCallback?:Function
}

const UIFrame: FC<IFrame> = (props) => {
    const [context, topbar] = useConstants();
    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [children, components, componentSizes] = useComponents(props.id, props.className);

    const menuBarProps = useMemo(() => context.contentStore.getMenuBar(props.id), [children]);

    const hasToolBars = useMemo(() => context.contentStore.hasToolBars(props.id), [children]);

    const [menuBarSize, setMenuBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const [toolBarSize, setToolBarSize] = useState<Dimension>({ width: 0, height: 0 });

    const menuBarSizeCallback = useCallback((size:Dimension) => setMenuBarSize(size), []);

    const toolBarSizeCallback = useCallback((size:Dimension) => {
        if (toolBarSize.height !== size.height || toolBarSize.width !== size.width) {
            setToolBarSize(size)
        }
    }, [toolBarSize]);

    const adjustedStyle = useMemo(() => {
        const styleCopy:CSSProperties = {...props.frameStyle};
        if (props.frameStyle) {
            styleCopy.height = (props.frameStyle.height as number) - menuBarSize.height - toolBarSize.height;
        }
        return styleCopy;
    }, [menuBarSize, toolBarSize, props.frameStyle]);

    return (
        <div style={{ visibility: componentSizes ? undefined : "hidden" }}>
            {props.internal &&
                <div className="rc-frame-header">
                    <span className="rc-frame-header-title">{props.title}</span>
                    <button
                        className="rc-frame-header-close-button pi pi-times"
                        onClick={() => {
                            const dispatchReq = createDispatchActionRequest();
                            dispatchReq.componentId = props.name;
                            showTopBar(context.server.sendRequest(dispatchReq, REQUEST_ENDPOINTS_V2.DISPATCH_ACTION), topbar);
                        }}
                    />
                </div>
            }
            {menuBarProps && <UIMenuBar {...menuBarProps} sizeCallback={menuBarSizeCallback} currentSize={menuBarSize} />}
            {hasToolBars && <UIToolbar id={props.id + "-frame-toolbar"} sizeCallback={toolBarSizeCallback} />}
            <Layout
                id={props.id}
                className={props.className}
                layoutData={props.layoutData}
                layout={props.layout}
                preferredSize={parsePrefSize(props.preferredSize)}
                minimumSize={parseMinSize(props.minimumSize)}
                maximumSize={parseMaxSize(props.maximumSize)}
                compSizes={componentSizes ? new Map([...componentSizes].filter(comp => context.contentStore.getComponentById(comp[0])?.["~additional"] !== true)) : undefined}
                components={components.filter(comp => comp.props["~additional"] !== true)}
                style={panelGetStyle(false, adjustedStyle)}
                reportSize={props.sizeCallback ? props.sizeCallback : () => {}}
                parent={props.parent} />
        </div>
    )
}
export default UIFrame