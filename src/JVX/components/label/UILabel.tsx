import React, {FC, useContext, useLayoutEffect, useRef} from "react";
import './UILabel.scss'
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import {getFont} from "../compprops/ComponentProperties";
import {checkAlignments} from "../compprops/CheckAlignments";

export interface uiLabel extends BaseComponent {
    text: string
}

const UILabel: FC<uiLabel> = (baseProps) => {
    const labelRef = useRef<HTMLSpanElement>(null);
    const layoutValue = useContext(LayoutContext);

    const [props] = useProperties<uiLabel>(baseProps.id, baseProps);
    const {onLoadCallback, id} = baseProps;
    const lblAlignments = checkAlignments(props);
    const lblFont = getFont(props.font);

    useLayoutEffect(() => {
        if(labelRef.current && onLoadCallback){
            const size = labelRef.current.getBoundingClientRect();
            onLoadCallback(id, size.height, size.width);
        }
    }, [onLoadCallback, id]);


    return(
        <span ref={labelRef} className="jvxLabel" style={layoutValue.get(props.id) ? {
            justifyContent: lblAlignments.ha,
            alignItems: lblAlignments.va,
            backgroundColor: props.background,
            color: props.foreground,
            ...lblFont,
            ...layoutValue.get(props.id)
        } : {
                justifyContent: lblAlignments.ha,
                alignContent: lblAlignments.va,
                backgroundColor: props.background,
                color: props.foreground,
                ...lblFont,
            }}>
            {props.text}
        </span>
    )
}
export default UILabel