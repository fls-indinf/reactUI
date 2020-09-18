import React, { useEffect, useRef, useContext, useLayoutEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';
import { getPreferredSize } from '../../../helper/GetSizes';
import { RefContext } from '../../../helper/Context';


function UIEditorText(props){
    const [selectedColumn, editColumn] = useRowSelect(props.columnName, props.initialValue || "", 
                                                      props.id, props.dataRow, props.cellEditor.className);
    const inputRef = useRef();
    const con = useContext(RefContext)

    useEffect(() => {
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props), 
                id: props.id, 
                parent: props.parent
            }
        );
    }, [con, props]);

    useLayoutEffect(() => {
        if(inputRef.current.element){
            const alignments = checkCellEditorAlignments(props);
            inputRef.current.element.style['background-color'] = props['cellEditor.background'];
            inputRef.current.element.style['text-align'] = alignments.ha;
        }
    })
    
    return (
        <InputText
            ref={inputRef}
            id={props.id}
            value={selectedColumn}
            style={props.layoutStyle}
            onChange={change => editColumn(change.target.value, props.columnName)}
            onBlur={() => {
                if (props.rowId) {
                    if (con.contentStore.selectedRow.get(props.dataRow) === props.rowId - 1) {
                        con.serverComm.setValues(props.name, props.dataRow, props.columnName, selectedColumn)
                    }
                }
                else {
                    con.serverComm.setValues(props.name, props.dataRow, props.columnName, selectedColumn)
                }
            }}
            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorText