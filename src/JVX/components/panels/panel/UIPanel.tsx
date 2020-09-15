import React, {FC, useRef} from "react";
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";

export interface Panel extends BaseComponent{
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    "screen.title": string,
}

const UIPanel: FC<Panel> = (props) => {

    return(
        <Layout onFinish={props.onLoadCallback} parent={props.parent} id={props.id} layout={props.layout} layoutData={props.layoutData} />
    )
}
export default UIPanel