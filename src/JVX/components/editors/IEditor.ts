import BaseComponent from "../BaseComponent";
import {CSSProperties} from "react";

/** Interface for cellEditor property of CellEditors */
export interface ICellEditor{
    className: string,
    contentType?: string,
    horizontalAlignment?: 0 | 1 | 2| 3,
    verticalAlignment?: 0 | 1 | 2| 3,
    directCellEditor?: boolean,
}

/** Base Interface for CellEditors */
export interface IEditor extends BaseComponent{
    cellEditor?: ICellEditor,
    cellEditor_editable_:boolean,
    cellEditor_horizontalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_verticalAlignment_?: 0 | 1 | 2| 3,
    cellEditor_background_?:string,
    enabled: boolean,
    columnName: string,
    dataRow: string,
    eventFocusedGain?: boolean,
    text:string
    onSubmit?: Function
    editorStyle?: CSSProperties
    autoFocus?: boolean
    nullable?: boolean
    readonly?: boolean

}