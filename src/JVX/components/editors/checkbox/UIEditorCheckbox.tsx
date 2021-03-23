/** React imports */
import React, {FC, useContext, useLayoutEffect, useRef, useState} from "react";

/** 3rd Party imports */
import {Checkbox} from 'primereact/checkbox';

/** Hook imports */
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";

/** Other imports */
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { getAlignments } from "../../compprops/GetAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

/** Interface for cellEditor property of CheckBoxCellEditor */
interface ICellEditorCheckbox extends ICellEditor{
    text?: string,
    selectedValue?:string|boolean|number|undefined, 
    preferredEditorMode?: number
}

/** Interface for CheckBoxCellEditor */
export interface IEditorCheckbox extends IEditor{
    cellEditor: ICellEditorCheckbox
}

/**
 * The CheckBoxCellEditor displays a CheckBox and its label and edits its value in its databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorCheckbox: FC<IEditorCheckbox> = (baseProps) => {
    /** Reference for the span that is wrapping the button containing layout information */
    const cbxRef = useRef(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Use context for the positioning, size informations of the layout */
    const layoutValue = useContext(LayoutContext);
    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorCheckbox>(baseProps.id, baseProps)
    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    /** Alignments for CellEditor */
    const alignments = getAlignments(props);

    /**
     * Returns the CheckBox Type based on the selectedValue. The value of a checkbox can be:
     * string, number and boolean
     * @param selectedValue - the selected value
     * @returns the CheckBox Type, string, number or boolean 
     */
    const getCbxType = (selectedValue:string|boolean|number|undefined) => {
        if (selectedValue === 'Y') {
            return 'STRING';
        }
        else if (selectedValue === 1) {
            return 'NUMBER';
        }
        else {
            return 'BOOLEAN';
        }
    }

    /**
     * Returns the boolean value depending on the CheckBox input
     * @param input - value of CheckBoxCellEditor
     * @returns boolean value of CheckBox input
     */
    const getBooleanValue = (input:string|boolean|number|undefined) => {
        if (input === 'Y' || input === true || input === 1) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Returns the correct value which needs to be sent to the server based on the CheckBoxCellEditor type.
     * @param value - current CheckBox value 
     * @param type - CheckBoxCellEditor type
     * @returns the correct value for CheckBox type to send to server
     */
    const getColumnValue = (value:boolean, type:string) => {
        if (value) {
            switch (type) {
                case 'STRING': return 'N';
                case 'NUMBER': return 0;
                default: return false;
            }
        }
        else {
            switch (type) {
                case 'STRING': return 'Y';
                case 'NUMBER': return 1;
                default: return true;
            }
        }
    }

    /** The CheckBox type */
    const cbxType = getCbxType(props.cellEditor.selectedValue)
    /** Current state of wether the CheckBox is currently checked or not */
    const [checked, setChecked] = useState(getBooleanValue(selectedRow))
    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && cbxRef.current){
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), cbxRef.current, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    return (
        <span
            ref={cbxRef}
            className="rc-editor-checkbox"
            style={{
                ...layoutValue.get(props.id) || baseProps.editorStyle,
                backgroundColor: props.cellEditor_background_,
                justifyContent: alignments?.ha,
                alignItems: alignments?.va
            }}>
            <Checkbox
                inputId={id}
                checked={checked}
                onChange={() => {
                    setChecked(!checked)
                    sendSetValues(props.dataRow, props.name, props.columnName, getColumnValue(checked, cbxType), context.server)
                }} 
            />
            <label className="rc-editor-checkbox-label" htmlFor={id}>{props.cellEditor?.text}</label>
        </span>
    )
}
export default UIEditorCheckbox