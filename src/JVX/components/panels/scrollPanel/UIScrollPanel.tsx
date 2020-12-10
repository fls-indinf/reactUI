import {Panel} from "../panel/UIPanel";
import React, {FC, useContext} from "react";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";

const UIScrollPanel: FC<Panel> = (baseProps) => {


    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);
    const {onLoadCallback, id} = baseProps;
    const prefSize = parseJVxSize(props.preferredSize);

    const getStyle = () => {
        let s:React.CSSProperties;
        if (props.screen_modal_ && prefSize)
            s = {...layoutContext.get(id), height: prefSize.height, width: prefSize.width}
        else if (props.screen_modal_)
            s = {...layoutContext.get(id), height: undefined, width: undefined}
        else
            s = {...layoutContext.get(id) || {}}
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        (s.width as number) -= 20;
        (s.height as number) -= 20;
        return s
    }

    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Size = {height: height+20, width: width+20};
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    return(
        <div id={props.id} style={props.screen_modal_ ? { height: (prefSize?.height as number), width: prefSize?.width, overflow: 'auto'} : {...layoutContext.get(baseProps.id), overflow: 'auto'}}>
            <Layout
                id={id}
                layoutData={props.layoutData}
                layout={props.layout}
                reportSize={reportSize}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}

export default UIScrollPanel