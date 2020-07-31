import React from 'react';
import UIButton from "../dynamic/UIButton";
import UIPanel from "../dynamic/UIPanel";
import UITable from '../dynamic/UITable';
import UILabel from '../dynamic/UILabel';
import UISplitPanel from '../dynamic/UISplitPanel';
import UIEditorCheckbox from '../dynamic/editors/checkbox/UIEditorCheckbox';
import UIEditorNumber from '../dynamic/editors/number/UIEditorNumber';
import UIEditorText from '../dynamic/editors/text/UIEditorText';
import UIEditorLinked from '../dynamic/editors/linked/UIEditorLinked';
import UIEditorImage from '../dynamic/editors/image/UIEditorImage';


export function createButton(buttonData){
    return <UIButton data={buttonData} key={buttonData.id} />
}

export function createPanel(panelData){
    return  <UIPanel data={panelData} key={panelData.id} />
}

export function createTable(tableData) {
    return <UITable data={tableData} key={tableData.id} />
}

export function createLabel(labelData) {
    return <UILabel data={labelData} key={labelData.id} />
}

export function createEditor(editorData) {
    const props= {
        data: editorData,
        key: editorData.id
    }

    if(editorData.cellEditor.className === "CheckBoxCellEditor"){
        return <UIEditorCheckbox {...props}/>
    } else if(editorData.cellEditor.className === "NumberCellEditor"){
        return <UIEditorNumber {...props}/>
    } else if(editorData.cellEditor.className === "TextCellEditor"){
        return <UIEditorText {...props}/>
    } else if(editorData.cellEditor.className === "LinkedCellEditor"){
        return <UIEditorLinked {...props}/>
    } else if(editorData.cellEditor.className === "ImageViewer"){
        return <UIEditorImage {...props}/>
    } else if(editorData.cellEditor.className === "DateCellEditor"){
        return <UIEditorText {...props}/>
    }
}

export function createSplitPanel(splitPanelData) {
    return <UISplitPanel data={splitPanelData} key={splitPanelData.id}/>
}