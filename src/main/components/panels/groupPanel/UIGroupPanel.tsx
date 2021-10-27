/** React imports */
import React, { CSSProperties, FC, useContext, useRef } from "react";

/** 3rd Party imports */
import { Tooltip } from "primereact/tooltip";

/** Hook imports */
import { useProperties, useComponents, useLayoutValue, useMouseListener, usePopupMenu } from "../../zhooks";

/** Other imports */
import { Layout } from "../../layouts";
import { IPanel } from "..";
import { parsePrefSize, parseMinSize, parseMaxSize, Dimension, panelReportSize, panelGetStyle } from "../../util";
import { appContext } from "../../../AppProvider";


/**
 * This component is a panel with a header, useful to group components
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIGroupPanel: FC<IPanel> = (baseProps) => {
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties(baseProps.id, baseProps);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, {visibility: 'hidden'});

    /** Current state of all Childcomponents as react children and their preferred sizes */
    const [components, componentSizes] = useComponents(baseProps.id, props.className);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Preferred size of panel */
    const prefSize = parsePrefSize(props.preferredSize);

    /** Reference for the panel element */
    const panelRef = useRef<any>(null)

    /** Hook for MouseListener */
    useMouseListener(props.name, panelRef.current ? panelRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    /** 
     * The component reports its preferred-, minimum-, maximum and measured-size to the layout
     * In panels, this method will be passed to the layouts
     */
    const reportSize = (prefSize:Dimension, minSize?:Dimension) => {
        panelReportSize(
            id, 
            "G", 
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
                ref={panelRef}
                className="rc-panel-group"
                id={props.name}
                {...usePopupMenu(props)}
                style={props.screen_modal_ || props.content_modal_ ?
                    { height: (prefSize?.height as number), width: prefSize?.width }
                    : { ...layoutStyle, backgroundColor: props.background }}
                data-pr-tooltip={props.toolTipText} >
                <div
                    className="rc-panel-group-caption">
                    <span>
                        {props.text}
                    </span>
                </div>
                <div
                    className="rc-panel-group-content"
                    style={{ ...(props.backgroundImage ? { '--backgroundImage': `url(${context.server.RESOURCE_URL + props.backgroundImage.split(',')[0]})` } as CSSProperties : {}) }}>
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
                        compSizes={componentSizes}
                        components={components}
                        style={panelGetStyle(
                            true,
                            layoutStyle,
                            prefSize,
                            props.screen_modal_ || props.content_modal_,
                            props.screen_size_
                        )}
                        parent={props.parent} />
                </div>
            </div>
        </>
    )
}

export default UIGroupPanel