import React, { CSSProperties } from "react"
import { format, formatISO, isValid } from 'date-fns'
import { CellEditorWrapper, CELLEDITOR_CLASSNAMES, ICellEditorDate, 
         ICellEditorImage, 
         ICellEditorNumber } from "../editors";
import { getDateLocale, getGrouping, getMinimumIntDigits, getScaleDigits } from "../../util";
import { LengthBasedColumnDescription, NumericColumnDescription } from "../../response"

/** An interface which contains properties used for CellEditors in tables */
export interface IInTableEditor {
    stopCellEditing?: Function
    passedKey?: string,
    isCellEditor: boolean,
    cellScreenName: string,
    editorStyle?: CSSProperties
}

/** 
 * Returns an in-cell editor for the column 
 * @param metaData - the metaData of the CellEditor
 * @param props - properties of the cell
 * @returns in-cell editor for the column
 */
export function displayEditor(metaData:LengthBasedColumnDescription|NumericColumnDescription|undefined, props:any, stopCellEditing:Function, passedValues:string) {
    let editor = <div>{props.cellData}</div>
    if (metaData) {
        editor = <CellEditorWrapper
        {...{
            ...metaData,
            name: props.name,
            dataRow: props.dataProvider,
            columnName: props.colName,
            id: "",
            cellEditor_editable_: true,
            editorStyle: {width: "100%", height: "100%"},
            autoFocus: true,
            stopCellEditing: stopCellEditing,
            passedKey: passedValues,
            isCellEditor: true,
            cellScreenName: props.dataProvider.split("/")[1]}} />
    }
    return editor
}

/** 
 * Returns properly rendered values for cells based on their CellEditors
 * @param metaData - the metaData of the CellEditor
 * @param cellData - the current value of the cell
 * @param resource - the resource string to receive images from the server
 * @param locale - the current locale
 * @returns properly rendered values for cells based on their CellEditors
 */
export function cellRenderer(
    metaData:LengthBasedColumnDescription|NumericColumnDescription|undefined, 
    cellData:any, 
    resource:string, 
    locale:string
) {
    if (cellData !== undefined) {
        if (metaData && metaData.cellEditor) {
            /** If the cell is a DateCellEditor use date-fns format to return the correct value with the correct format*/
            if (metaData.cellEditor.className === CELLEDITOR_CLASSNAMES.DATE) {
                const castedCellEditor = metaData.cellEditor as ICellEditorDate;
                if (isValid(cellData))
                    return castedCellEditor.dateFormat ? format(cellData, castedCellEditor.dateFormat, { locale: getDateLocale(locale) }) : formatISO(cellData);
                else
                    return null;
            }
            /** If the cell is a Password cell, return the text replaced with password dots */
            else if (metaData.cellEditor.className === CELLEDITOR_CLASSNAMES.TEXT && metaData.cellEditor.contentType === "text/plain;password") {
                if (cellData !== null)
                    return '\u25CF'.repeat(cellData.length);
                else
                    return null
            }
            /** If the cell is an image, get the image from the server decode it and return it */
            else if (metaData.cellEditor.className === CELLEDITOR_CLASSNAMES.IMAGE) {
                const castedCellEditor = metaData.cellEditor as ICellEditorImage
                return <img className="rc-table-image" src={cellData ? "data:image/jpeg;base64," + cellData : resource + castedCellEditor.defaultImageName} alt="could not be loaded"/>
            }
            /** If the cell is a NumberCellEditor format it accordingly */
            else if (metaData.cellEditor.className === CELLEDITOR_CLASSNAMES.NUMBER) {
                const castedMetaData = metaData as NumericColumnDescription
                const castedCellEditor = metaData.cellEditor as ICellEditorNumber
                if (cellData === null)
                    return null
                return Intl.NumberFormat(locale, 
                    {
                        useGrouping: getGrouping(castedCellEditor.numberFormat),
                        minimumIntegerDigits: getMinimumIntDigits(castedCellEditor.numberFormat),
                        minimumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).minScale,
                        maximumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).maxScale
                    }).format(cellData);
            }
            else if (typeof cellData === "string" && cellData.includes("<html>")) {
                return <span dangerouslySetInnerHTML={{ __html: cellData as string }}/>
            }
            else {
                return cellData;
            }       
        }
    } else {
        return null
    }
}