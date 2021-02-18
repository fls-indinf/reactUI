/** React imports */
import React, {FC, useContext, useLayoutEffect, useMemo, useRef, useState} from "react";

/** 3rd Party imports */
import {InputText} from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";

/** Other imports */
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import {handleEnterKey} from "../../util/HandleEnterKey";
import {onBlurCallback} from "../../util/OnBlurCallback";
import {checkCellEditorAlignments} from "../../compprops/CheckAlignments";
import {sendOnLoadCallback} from "../../util/sendOnLoadCallback";
import {parseJVxSize} from "../../util/parseJVxSize";
import {getEditorCompId} from "../../util/GetEditorCompId";

/** Interface for cellEditor property of TextCellEditor */
interface ICellEditorText extends ICellEditor{
    preferredEditorMode?: number
    length?:number
}

/** Interface for TextCellEditor */
export interface IEditorText extends IEditor{
    cellEditor: ICellEditorText
    borderVisible?: boolean
}

/**
 * TextCellEditor is an inputfield which allows to enter text. Based on the contentType the server sends it is decided wether
 * the CellEditor becomes a normal texteditor, a textarea or a passwor field, when the value is changed the databook on the server is changed
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorText: FC<IEditorText> = (baseProps) => {
    /** Reference for the TextCellEditor element */
    const textRef = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorText>(baseProps.id, baseProps);
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of the value for the selected row of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Current state value of input element */
    const [text, setText] = useState(selectedRow);
    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;
    /** The metadata for the TextCellEditor */
    const cellEditorMetaData:IEditorText|undefined = context.contentStore.dataProviderMetaData.get(compId)?.get(props.dataRow)?.columns.find(column => column.name === props.columnName) as IEditorText;
    /**
     * Returns the maximum length for the TextCellEditor
     * @returns maximum length for the TextCellEditor
     */
    const length = useMemo(() => cellEditorMetaData?.cellEditor.length, [cellEditorMetaData])
    
    /** Set inputfield style properties if the border is invisible add a styleclass */
    useLayoutEffect(() => {
        //@ts-ignore
        const currElem = textRef.current.element
        if(currElem){
            if (props.borderVisible === false && !currElem.classList.contains("invisible-border"))
                currElem.classList.add("invisible-border");
            currElem.style.setProperty('background', props.cellEditor_background_);
            currElem.style.setProperty('text-align', checkCellEditorAlignments(props).ha);
        }
    });

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout, password ref has a inconsistency */
    useLayoutEffect(() => {
        if(onLoadCallback && textRef.current) {
            if (props.cellEditor.contentType?.includes("password")) {
                //@ts-ignore
                sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), textRef.current.inputEl, onLoadCallback)
            }
            else {
                // @ts-ignore
                sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), textRef.current.element, onLoadCallback)
            }
        }
    },[onLoadCallback, id, props.cellEditor.contentType, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useLayoutEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    },[selectedRow]);

    /** Return either a textarea, password or normal textfield based on server sent contentType */
    if (props.cellEditor.contentType?.includes("multiline")) {
        return (
            <InputTextarea
            autoFocus={baseProps.autoFocus}
            ref={textRef}
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
            ref={textRef}
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
                ref={textRef}
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