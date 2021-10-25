/** React imports */
import React, { FC, useContext, useLayoutEffect, useMemo, useRef } from "react";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, panelReportSize, panelGetStyle, concatClassnames } from "../../util";
import { appContext } from "../../../AppProvider";
import { IPanel } from "..";
import { Tooltip } from "primereact/tooltip";
import COMPONENT_CLASSNAMES from "../../COMPONENT_CLASSNAMES";

/** Interface for ToolbarHelper */
export interface IToolBarHelper extends IPanel {
    isNavTable:boolean;
    toolBarVisible?:boolean
}

const ToolBarHelper:FC<IToolBarHelper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(props.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = props;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null);

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const filteredComponents = useMemo(() => {
        return props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN ? components.filter(comp => comp.props["~additional"] && !comp.props.id.includes("-tb")) : components.filter(comp => !comp.props["~additional"] && !comp.props.id.includes("-tb"))
    }, [props.className, components]);

    const getTBPosClassName = (constraint:string) => {
        switch(constraint) {
            case "North":
                return "navbar-north";
            case "West":
                return "navbar-west";
            case "East":
                return "navbar-east";
            case "South":
                return "navbar-south";
            default:
                return "navbar-north";
        }
    }

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
     const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "P", 
            prefSize,
            props.className,
            minSize, 
            props.preferredSize, 
            props.minimumSize, 
            props.maximumSize, 
            onLoadCallback
        )
    }  
    
    return (
        <>
            <Tooltip target={"#" + props.name} />
            <div
                className={concatClassnames(
                    props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN ? "rc-toolbar" : "rc-panel",
                    props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN && props.isNavTable ? getTBPosClassName(props.constraints) : ""
                )}
                ref={panelRef}
                id={props.name}
                style={props.screen_modal_ ? {
                    height: prefSize?.height,
                    width: prefSize?.width,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {}),
                    display: filteredComponents.length === 0 ? "none" : ""
                } : {
                    ...layoutStyle,
                    backgroundColor: props.background,
                    ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } : {}),
                    display: filteredComponents.length === 0 ? "none" : ""
                }}
                data-pr-tooltip={props.toolTipText}>
                <Layout
                    id={id}
                    className={props.className}
                    layoutData={props.layoutData}
                    layout={props.layout}
                    preferredSize={parsePrefSize(props.preferredSize)}
                    minimumSize={parseMinSize(props.minimumSize)}
                    maximumSize={parseMaxSize(props.maximumSize)}
                    popupSize={parsePrefSize(props.screen_size_)}
                    reportSize={reportSize}
                    compSizes={componentSizes ? new Map([...componentSizes].filter((v, k) => !v[0].includes("-tb"))) : undefined}
                    components={filteredComponents}
                    style={panelGetStyle(
                        false,
                        layoutStyle,
                        prefSize,
                        props.screen_modal_,
                        props.screen_size_
                    )}
                    parent={props.parent} />
            </div>
        </>
    )
}

const UIToolBarHelper: FC<IToolBarHelper> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    useLayoutEffect(() => {
        const reportFunc = () => panelReportSize(
            props.id,
            "P",
            { height: 0, width: 0 },
            props.className,
            { height: 0, width: 0 },
            props.preferredSize,
            props.minimumSize,
            props.maximumSize,
            props.onLoadCallback
        )
        if (props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
            if (props.toolBarVisible === false) {
                reportFunc();
            }
            else if (props.toolBarVisible === undefined) {
                if (context.contentStore.getChildren(props.id, props.className).size === 0 && props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
                    reportFunc();
                }
            }
        }
    }, [props.onLoadCallback, props.id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        (props.className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) ?
            (props.toolBarVisible === undefined) ?
                (context.contentStore.getChildren(props.id, props.className).size > 0) ?
                    <ToolBarHelper {...props} />
                    :
                    <div style={{ visibility: "hidden" }} />
                :
                (props.toolBarVisible) ? <ToolBarHelper {...props} /> : <div style={{ visibility: "hidden" }} />
            :
            <ToolBarHelper {...props} />
    )
}
export default UIToolBarHelper