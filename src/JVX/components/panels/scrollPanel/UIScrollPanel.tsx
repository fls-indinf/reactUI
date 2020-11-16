import {Panel} from "../panel/UIPanel";
import React, {FC, useContext} from "react";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Layout from "../../layouts/Layout";

const UIScrollPanel: FC<Panel> = (baseProps) => {


    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);

    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}};
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        (s.width as number) -= 20;
        (s.height as number) -= 20;
        return s
    }

    return(
        <div id={props.id} style={{...layoutContext.get(baseProps.id), overflow: "auto"}}>
            <Layout
                id={baseProps.id}
                layoutData={props.layoutData}
                layout={props.layout}
                onLoad={baseProps.onLoadCallback}
                preferredCompSizes={preferredComponentSizes}
                components={components}
                style={getStyle()}/>
        </div>
    )
}

export default UIScrollPanel