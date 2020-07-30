import React, { Component } from 'react';

import {DataTable} from 'primereact/datatable';
import {Column} from 'primereact/column';
import { Size } from '../helper/Size';
import './UITable.scss'
import { RefContext } from '../helper/Context';
import Base from './Base';


class UITable extends Base {
    content = [];
    dataColumns = [];
    state = {  }
    maximumSize = new Size(undefined, undefined, this.props.maximumSize)
    
    constructor(props){
        super(props);
        this.buildColumns(this.props.columnLabels, this.props.columnNames);
    }

    componentDidMount() {
        //this.startUp()

        if(!this.state.Data){
            this.getData()
        }
    }

    getData(){
        this.context.serverComm.fetchDataFromProvider(this.props.dataProvider)
        .then(res => res.json())
        .then(jres => this.buildData(jres))
    }

    buildColumns(labels, names){
        for (let index = 0; index < labels.length; index++){
            const column = <Column 
            field={names[index]} 
            header={labels[index]}
            key={names[index]}
            ref={ref => column.columnRef = ref}/>;
            this.dataColumns.push(column);
        }
    }

    buildData(data){
        let tempArray = []
        data[0].records.forEach(set => {
            let tableData = {}
            for (let index = 0; index <= data[0].columnNames.length; index++){
                tableData[data[0].columnNames[index]] = set[index]
            }
            tempArray.push(tableData);
        });
        this.setState({Data: tempArray})
    }

    onSelectChange(event){
        let value = event.value
        this.context.contentSafe.changeSelectedRowOfTable(this.props.id, value)
    }

    getPrefferedSize() {
        console.log(this.maximumSize)
    }

    render() {
        return ( 
            <DataTable
                id={this.props.id}
                value={this.state.Data ? this.state.Data : [] } 
                scrollable={true} 
                valueable={true}    
                scrollHeight="100%" 
                style={{
                    overflow:"auto",
                    height: '100%'}} 
                header="Table"
                selectionMode="single"
                onSelectionChange={this.onSelectChange.bind(this)}>
                {this.dataColumns}
            </DataTable>);
    }
}
UITable.contextType = RefContext;
export default UITable;