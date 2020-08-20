import React, { useContext, useEffect, useRef } from 'react';
import { RefContext } from '../../../helper/Context';
import './UIEditorLinked.scss'

// prime
import { AutoComplete } from 'primereact/autocomplete';

// hooks
import useFetchListen from "../../../hooks/useFetchListen";
import useRowSelect from '../../../hooks/useRowSelect';
import { checkCellEditorAlignments } from '../../../helper/CheckAlignments';

function UIEditorLinkedHooks(props){
    const [fetchedData] = useFetchListen(props.cellEditor.linkReference.dataProvider);
    const [selectedColumn, editColumn] = useRowSelect(props.columnName);
    const con = useContext(RefContext)
    const autoComRef = useRef()

    useEffect(()=> {
        if(props.initialValue){
            editColumn(props.initialValue)
        }
        if(autoComRef.current.inputEl){
            const alignments = checkCellEditorAlignments(props);
            autoComRef.current.inputEl.style['background-color'] = props['cellEditor.background'];
            autoComRef.current.inputEl.style['text-align'] = alignments.ha;
        }
    })

    function buildSuggestions(response= {records: []}){
        let suggestions= []
        response.records.forEach(record => {
            let element = {};
            record.forEach((data, index) => {
                if(data !== null) element[props.cellEditor.clearColumns[index]] = data
            });
            suggestions.push(element);
        });
        return suggestions
    }

    function onInputChange(event){
        con.serverComm.fetchFilterdData(
            props.cellEditor.linkReference.dataProvider,
            event.query,
            props.name);
    }

    return (
        <AutoComplete
            appendTo={document.body}
            id={props.id}
            style={props.layoutStyle}
            ref={autoComRef}

            dropdown={true}
            completeMethod={onInputChange}
        
            suggestions={buildSuggestions(fetchedData)}
            field={props.columnName}

            value={selectedColumn} 
            onChange={event => editColumn(event.target.value)}

            disabled={!props["cellEditor.editable"]}
        />
    );
}
export default UIEditorLinkedHooks