import React, {FC, useContext, useState} from "react";
import './UIPanel.scss'
import Layout from "../../layouts/Layout";
import BaseComponent from "../../BaseComponent";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useComponents from "../../zhooks/useComponents";
import Size from "../../util/Size";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { Dialog } from 'primereact/dialog';

export interface Panel extends BaseComponent{
    orientation: number,
    layout: string,
    layoutData: string,
    "mobile.autoclose": boolean,
    screen_modal_?: boolean
    screen_navigationName_?:string
    screen_title_?: string,
}

const UIPanel: FC<Panel> = (baseProps) => {

    const layoutContext = useContext(LayoutContext);
    const [props] = useProperties(baseProps.id, baseProps);
    const [components, preferredComponentSizes] = useComponents(baseProps.id);
    const [dialogVisible, setDialogVisible] = useState(props.screen_modal_ ? true : false)
    const {onLoadCallback, id} = baseProps;

    const getStyle = () => {
        const s = {...layoutContext.get(baseProps.id) || {}}
        if (Object.getOwnPropertyDescriptor(s, 'top')?.configurable && Object.getOwnPropertyDescriptor(s, 'left')?.configurable) {
            s.top = undefined;
            s.left = undefined;
        }
        return s
    }

    const reportSize = (height:number, width:number) => {
        if (onLoadCallback) {
            const prefSize:Size = {height: height, width: width}
            sendOnLoadCallback(id, prefSize, parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), undefined, onLoadCallback);
        }
    }

    const handleOnHide = () => {
        setDialogVisible(false);
    }

    if (dialogVisible) {
        return (
            <Dialog header={props.screen_title_} visible={dialogVisible} onHide={handleOnHide}>
                <div id={props.id} style={{ ...layoutContext.get(baseProps.id), backgroundColor: props.background }}>
                    <Layout
                        id={id}
                        layoutData={props.layoutData}
                        layout={props.layout}
                        reportSize={reportSize}
                        preferredCompSizes={preferredComponentSizes}
                        components={components}
                        style={getStyle()} />
                </div>
            </Dialog>
        )
    }

    return(
        <div id={props.id} style={{...layoutContext.get(baseProps.id), backgroundColor: props.background}}>
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
export default UIPanel