import React, {FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";
import {InputText} from "primereact/inputtext";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {handleEnterKey} from "../../util/HandleEnterKey";
import {onBlurCallback} from "../../util/OnBlurCallback";
import {checkCellEditorAlignments} from "../../compprops/CheckAlignments";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode?: number
    length?:number
}

export interface IEditorText extends IEditor{
    cellEditor: ICellEditorText
    borderVisible?: boolean
}

const UIEditorText: FC<IEditorText> = (baseProps) => {

    const inputRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();
    const [text, setText] = useState(baseProps.text || "");
    const cellEditorMetaData:IEditorText|undefined = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataRow)?.columns.find(column => column.name === props.columnName) as IEditorText;
    const length = useMemo(() => cellEditorMetaData?.cellEditor.length, [cellEditorMetaData])
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        //@ts-ignore
        let currElem = inputRef.current.element;
        if(currElem){
            currElem.style.setProperty('background', props.cellEditor_background_);
            currElem.style.setProperty('text-align', checkCellEditorAlignments(props).ha);
        }
    });

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            const currElem = inputRef.current.element
            if (props.borderVisible === false && !currElem.classList.contains("invisible-border")) {
                currElem.classList.add("invisible-border");
            }
            if (props.cellEditor.contentType?.includes("password")) {
                //@ts-ignore
                sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current.inputEl, onLoadCallback)
            }
            else {
                // @ts-ignore
                sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current.element, onLoadCallback)
            }
        }
    },[onLoadCallback, id, props.borderVisible, props.cellEditor.contentType, props.preferredSize, props.maximumSize, props.minimumSize]);

    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    if (props.cellEditor.contentType?.includes("multiline")) {
        return (
            <InputTextarea
            autoFocus={baseProps.autoFocus}
            ref={inputRef}
            className="rc-editor-textarea"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            maxLength={length}
            disabled={!props.cellEditor_editable_}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
            onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
        />
        )
    }
    else if (props.cellEditor.contentType?.includes("password")) {
        return (
            <Password
            autoFocus={baseProps.autoFocus}
            ref={inputRef}
            className="rc-editor-password"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            maxLength={length}
            feedback={false}
            disabled={!props.cellEditor_editable_}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
            onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
        />
        )
    }
    else {
        return(
            <InputText
                autoFocus={baseProps.autoFocus}
                ref={inputRef}
                className="rc-editor-text"
                style={layoutValue.get(props.id) || baseProps.editorStyle}
                maxLength={length}
                disabled={!props.cellEditor_editable_}
                value={text || ""}
                onChange={event => setText(event.currentTarget.value)}
                onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
                onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
            />
        )
    }
}
export default UIEditorText