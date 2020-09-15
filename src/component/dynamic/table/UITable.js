import React, { useEffect, useContext, useState } from 'react';
import './UITable.scss'

import { RefContext } from '../../helper/Context';
import { createEditor } from "../../factories/ComponentFactory";

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { getPreferredSize } from '../../helper/GetSizes';

function UITable(props) {
    const [data, setData] = useState();
    const [dataColumns, setDataColumns] = useState()
    const con = useContext(RefContext);

    useEffect(() => {
        let fetchSub = con.contentStore.fetchCompleted.subscribe(fetchData => {
            if (fetchData.dataBook === props.dataBook) {
                console.log(fetchData)
                buildData(fetchData);
            }
        });

        const buildColumns = (labels, names) => {
            let tempDataColumns = [];
            for (let index = 0; index < labels.length; index++) {
                let columnProps = {
                    field: names[index],
                    header: labels[index],
                    key: names[index]
                };
                let metaData = con.contentStore.metaData.get(names[index]);
                if (metaData) {
                    metaData.name = props.name;
                    metaData.cellEditor.clearColumns = ["ID", names[index]];
                    columnProps.editor = (props) => buildEditor(props, metaData);
                }
                tempDataColumns.push(<Column onEditorInit={() => console.log(document.getElementById(props.id))} {...columnProps}/>);
            }
            setDataColumns(tempDataColumns)
        };
        buildColumns(props.columnLabels, props.columnNames);
        
        let data = con.contentStore.storedData.get(props.dataBook);
        if (data) {
            buildData(data);
        }
        con.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize(props),
                id: props.id,
                parent: props.parent
            }
        );
        return fetchSub.unsubscribe();
        // eslint-disable-next-line
    }, [con, props]);

    const buildData = async data => {
        let tempArray = []
        data.records.forEach(set => {
            let tableData = {}
            for (let index = 0; index <= data.columnNames.length; index++) {
                tableData[data.columnNames[index]] = set[index];
            }
            tempArray.push(tableData);
        });
        setData(tempArray);
    }

    const buildEditor = (buildProps, data) => {
        if (data) {
            const className = data.cellEditor.className;
            if (className === "LinkedCellEditor") {
                data.appendToBody = true;
            } 
            else if (className === "DateCellEditor") {
                data.appendToBody = true;
            }
            data["cellEditor.editable"] = true;
            data.columnName = buildProps.field;
            data.initialValue = buildProps.rowData[buildProps.field];
            data.dataRow = props.dataBook;
            return createEditor(data);
        } 
        else {
            return undefined;
        }
    }

    const onSelectChange = async event => {
        const value = event.data;
        con.contentStore.emitChangeOfSelectedRow(value);
        con.serverComm.selectRow(props.name, props.dataBook, value)
    }

    return (
        <DataTable
            id={props.id}
            header="Table"
            value={data ? data : []}
            onRowClick={onSelectChange}
            resizableColumns={true}
            columnResizeMode={"expand"}
            scrollable={true}
            style={props.layoutStyle}>
            {dataColumns}
        </DataTable>
    );
}
export default UITable;