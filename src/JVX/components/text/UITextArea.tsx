import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import {InputTextarea} from "primereact/inputtextarea";
import BaseComponent from "../BaseComponent";
import {LayoutContext} from "../../LayoutContext";
import useProperties from "../zhooks/useProperties";
import { sendOnLoadCallback } from "../util/sendOnLoadCallback";

const UITextArea: FC<BaseComponent> = (baseProps) => {

    const inputRef = useRef(null);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<BaseComponent>(baseProps.id, baseProps);

    const [text, setText] = useState("");
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            sendOnLoadCallback(id, props.preferredSize, inputRef.current, onLoadCallback)
        }
    },[onLoadCallback, id])

    return (
        <InputTextarea ref={inputRef} value={text||""} style={{...layoutValue.get(props.id), resize: 'none'}} onChange={event => setText(event.currentTarget.value)} />
    )
}
export default UITextArea