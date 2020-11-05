import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";
import './UIEditorText.scss'
import {InputText} from "primereact/inputtext";
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {handleEnterKey} from "../../util/HandleEnterKey";
import {onBlurCallback} from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";

interface ICellEditorText extends ICellEditor{
    preferredEditorMode?: number
}

export interface IEditorText extends IEditor{
    cellEditor?: ICellEditorText
    borderVisible?: boolean
}

const UIEditorText: FC<IEditorText> = (baseProps) => {

    const inputRef = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);
    const [selectedRow] = useRowSelect(props.dataRow, props.columnName);
    const lastValue = useRef<any>();

    const [text, setText] = useState(baseProps.text || "");
    const {onLoadCallback, id} = baseProps;

    useLayoutEffect(() => {
        //@ts-ignore
        let currElem = inputRef.current.element;
        if(currElem){
            currElem.style.setProperty('background-color', props.cellEditor_background_);
            currElem.style.setProperty('text-align', checkCellEditorAlignments(props).ha);
        }
    })

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            //@ts-ignore
            const currElem = inputRef.current.element
            if (props.borderVisible === false && !currElem.classList.contains("invisibleBorder")) {
                currElem.classList.add("invisibleBorder");
            }
            // @ts-ignore
            const size: Array<DOMRect> = inputRef.current.element.getClientRects();
            onLoadCallback(id, size[0].height, size[0].width);
        }
    },[onLoadCallback, id, props.borderVisible]);

    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);


    return(
        <InputText
            autoFocus={baseProps.autoFocus}
            ref={inputRef}
            className="jvxEditorText"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            disabled={!props.cellEditor_editable_}
            value={text || ""}
            onChange={event => setText(event.currentTarget.value)}
            onBlur={() => onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
            onKeyDown={event => handleEnterKey(event, () => sendSetValues(props.dataRow, props.name, props.columnName, text, lastValue.current, context.server))}
        />
    )
}
export default UIEditorText