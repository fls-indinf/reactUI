/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import _ from "underscore";
import { appContext } from "../../contexts/AppProvider";
import useMetaData from "../../hooks/data-hooks/useMetaData";
import useEventHandler from "../../hooks/event-hooks/useEventHandler";
import useOutsideClick from "../../hooks/event-hooks/useOutsideClick";
import { ColumnDescription, LengthBasedColumnDescription, NumericColumnDescription } from "../../response/data/MetaDataResponse";

import { getFont, parseIconData } from "../comp-props/ComponentProperties";
import IconProps from "../comp-props/IconProps";
import CellEditorWrapper from "../editors/CellEditorWrapper";
import CELLEDITOR_CLASSNAMES from "../editors/CELLEDITOR_CLASSNAMES";
import DateCellRenderer from "./CellRenderer/DateCellRenderer";
import DirectCellRenderer from "./CellRenderer/DirectCellRenderer";
import ImageCellRenderer from "./CellRenderer/ImageCellRenderer";
import LinkedCellRenderer from "./CellRenderer/LinkedCellRenderer";
import NumberCellRenderer from "./CellRenderer/NumberCellRenderer";
import TextCellRenderer from "./CellRenderer/TextCellRenderer";
import { SelectedCellContext } from "./UITable";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import { isFAIcon } from "../../hooks/event-hooks/useButtonMouseImages";

// Interface for in-table-editors
export interface IInTableEditor {
    stopCellEditing?: Function
    passedKey?: string,
    isCellEditor: boolean,
    editorStyle?: CSSProperties,
}

// Interface for cell-style-formatting
export interface CellFormatting {
    foreground?: string;
    background?: string;
    font?: string;
    image?: string;
}

// Interface for cell-renderer
export interface ICellRender extends ICellEditor {
    columnMetaData: ColumnDescription,
    icon: JSX.Element|null,
    stateCallback?: Function,
    decreaseCallback?: Function
}

/** Type for CellEditor */
export interface ICellEditor {
    pk: any,
    screenName: string,
    name: string,
    cellData: any,
    dataProvider: string,
    colName: string,
    resource: string,
    cellId: Function,
    tableContainer?: any,
    selectNext: Function,
    selectPrevious: Function,
    enterNavigationMode: number,
    tabNavigationMode: number,
    selectedRow: any,
    className?: string,
    colReadonly?: boolean,
    tableEnabled?: boolean
    cellFormatting?: Map<string, CellFormatting>,
    startEditing?:boolean,
    stopEditing:Function,
    editable?: boolean,
    insertEnabled?: boolean,
    updateEnabled?: boolean,
    deleteEnabled?: boolean,
    dataProviderReadOnly?: boolean
    rowNumber: number
    colIndex: number
    filter?: SelectFilter
    rowData: any,
    setIsEditing: Function,
    removeTableLinkRef?: Function,
    tableIsSelecting: boolean
}

/** 
 * Returns an in-cell editor for the column 
 * @param metaData - the metaData of the CellEditor
 * @param props - properties of the cell
 * @returns in-cell editor for the column
 */
function displayEditor(metaData: LengthBasedColumnDescription | NumericColumnDescription | undefined, props: any, stopCellEditing: Function, passedValues: string) {
    let editor = <div>{props.cellData}</div>
    if (metaData) {
        const docStyle = window.getComputedStyle(document.documentElement);
        const calcWidth = "calc(100% + " + docStyle.getPropertyValue('--table-cell-padding-left-right') + " + 0.1rem)";
        const calcHeight = "calc(100% + " + docStyle.getPropertyValue('--table-cell-padding-top-bottom') + ")";

        editor = <CellEditorWrapper
            {...{
                ...metaData,
                name: props.name,
                dataRow: props.dataProvider,
                columnName: props.colName,
                id: "",
                cellEditor_editable_: true,
                editorStyle: { 
                    width: calcWidth, 
                    height: calcHeight, 
                    //marginLeft: calcMarginLeft, 
                    //marginTop: calcMarginTop 
                },
                autoFocus: true,
                stopCellEditing: stopCellEditing,
                passedKey: passedValues,
                isCellEditor: true,
                rowNumber: props.rowNumber,
                isReadOnly: props.isReadOnly
            }} />
    }
    return editor
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
export const CellEditor: FC<ICellEditor> = (props) => {
    const { selectNext, selectPrevious, enterNavigationMode, tabNavigationMode, tableContainer } = props;
    
    /** State if editing is currently possible */
    const [edit, setEdit] = useState(false);

    /** Reference for element wrapping the cell value/editor */
    const wrapperRef = useRef(null);

    /** Reference which contains the pressed key for input editors */
    const passRef = useRef<string>("")

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Context for the selected cell */
    const cellContext = useContext(SelectedCellContext);

    /** Metadata of the columns */
    const columnMetaData = useMetaData(props.screenName, props.dataProvider, props.colName);

    const docStyle = window.getComputedStyle(document.documentElement);

    // Calculates the minus margin-left to display no gap when opening the cell-editor
    const calcMarginLeft = useMemo(() => "calc(0rem - calc(" + docStyle.getPropertyValue('--table-cell-padding-left-right') + " / 2) - 0.05rem)", []);

    // Calculates the minus margin-top to display no gap when opening the cell-editor
    const calcMarginTop = useMemo(() => "calc(0rem - calc(" + docStyle.getPropertyValue('--table-cell-padding-top-bottom') + " / 2) - 0.1rem)", []);
 
    /** State if the CellEditor is currently waiting for the selectedRow */
    //const [waiting, setWaiting] = useState<boolean>(false);

    const [storedClickEvent, setStoredClickEvent] = useState<Function|undefined>(undefined)

    /** When a new selectedRow is set, set waiting to false and if edit is false reset the passRef */
    useEffect(() => {
        if (props.selectedRow) {
            if (!edit) {
                passRef.current = "";
            }
            const pickedVals = _.pick(props.selectedRow.data, Object.keys(props.pk));
            // if (waiting && _.isEqual(pickedVals, props.pk)) {
            //     setWaiting(false);
            // }
        }
    }, [props.selectedRow, edit]);

    /** Whenn the selected cell changes and the editor is editable close it */
    useEffect(() => {
        if (edit && cellContext.selectedCellId !== props.cellId().selectedCellId) {
            setEdit(false);
            props.stopEditing()
        }
    }, [cellContext.selectedCellId]);

    // If the selected-cell id is this cell-editors id and startEditing is true, set the edit-state to true
    useEffect(() => {
        if (cellContext.selectedCellId === props.cellId().selectedCellId && props.startEditing) {
            setEdit(true);
        }
    },[props.startEditing]);

    /**
     * Callback for stopping the cell editing process, closes editor and based on keyboard input, selects the next or previous cell/row
     * @param event - the KeyboardEvent
     */
    const stopCellEditing = useCallback(async (event?:KeyboardEvent) => {
        let focusTable = true;
        setEdit(false);
        props.stopEditing()
        if (event) {
            if (event.key === "Enter") {
                if (event.shiftKey) {
                    focusTable = selectPrevious(enterNavigationMode);
                }
                else {
                    focusTable = selectNext(enterNavigationMode);
                }
            }
            else if (event.key === "Tab") {
                event.preventDefault();
                if (event.shiftKey) {
                    focusTable = selectPrevious(tabNavigationMode);
                }
                else {
                    focusTable = selectNext(tabNavigationMode);
                }
            }
        }
        else {
            focusTable = selectNext(enterNavigationMode);
        }
        if (focusTable) {
            tableContainer.focus();
        }
    }, [setEdit, selectNext, selectPrevious, enterNavigationMode, tabNavigationMode]);

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, () => { 
        setEdit(false); 
        props.stopEditing();
    }, columnMetaData);

    /**
     * Keylistener for cells, if F2 key is pressed, open the editor of the selected cell, if a key is pressed which is an input, open the editor and use the input
     */
    const handleCellKeyDown = useCallback((event: KeyboardEvent) => {
        if (cellContext.selectedCellId === props.cellId().selectedCellId) {
            switch (event.key) {
                case "F2":
                    setEdit(true);
                    break;
                default:
                    if (event.key.length === 1 && !event.ctrlKey) {
                        passRef.current = event.key;
                        setEdit(true);
                    }
            }
        }
    }, [cellContext.selectedCellId, setEdit]);

    /** Adds Keylistener to the tableContainer */
    useEventHandler(tableContainer, "keydown", handleCellKeyDown);

    // Returns true if the cell is editable
    const isEditable = useMemo(() => {
        if (!props.colReadonly
            && !props.dataProviderReadOnly 
            && props.updateEnabled 
            && props.tableEnabled !== false 
            && props.editable !== false) {
            return true;
        }
        return false;
        
    }, [props.dataProviderReadOnly, props.updateEnabled, props.colReadonly, props.tableEnabled, props.editable, props.cellData]);

    const cellStyles: { cellStyle: CSSProperties, cellClassNames: string[], cellIcon: IconProps | null } = useMemo(() => {
        let cellStyle:any = { };
        const cellClassNames:string[] = ['cell-data', typeof props.cellData === "string" && (props.cellData as string).includes("<html>") ? "html-cell" : ""];
        let cellIcon: IconProps | null = null;
    
        // Fills cell-classnames and cell-style based on the server-sent properties
        if (props.cellFormatting && props.cellFormatting.has(props.colName)) {
            const cellFormat = props.cellFormatting.get(props.colName) as CellFormatting
            if (cellFormat !== null) {
                if(cellFormat.background) {
                    cellStyle.backgroundColor = cellFormat.background;
                    cellClassNames.push('cancel-padding');
                }
                if(cellFormat.foreground) {
                    cellStyle.color = cellFormat.foreground;
                }
                if(cellFormat.font) {
                    const font = getFont(cellFormat.font);
                    cellStyle = {
                        ...cellStyle,
                        fontFamily: font ? font.fontFamily : undefined,
                        fontWeight: font ? font.fontWeight : undefined,
                        fontStyle: font ? font.fontStyle : undefined,
                        fontSize: font ? font.fontSize : undefined
                    }
                }
                if(cellFormat.image) {
                    cellIcon = parseIconData(cellFormat.foreground, cellFormat.image);
                }
            }
        }

        return { cellStyle: cellStyle, cellClassNames: cellClassNames, cellIcon: cellIcon }
    }, [props.cellFormatting, props.colName])

    // Returns the cell-icon or null
    const icon = useMemo(() => {
        if (cellStyles.cellIcon?.icon) {
            if(isFAIcon(cellStyles.cellIcon.icon))
                return <i className={cellStyles.cellIcon.icon} style={{ fontSize: cellStyles.cellIcon.size?.height, color: cellStyles.cellIcon.color}}/>
            else {
                return <img
                    id={props.name}
                    alt="icon"
                    src={context.server.RESOURCE_URL + cellStyles.cellIcon.icon}
                    style={{width: `${cellStyles.cellIcon.size?.width}px`, height: `${cellStyles.cellIcon.size?.height}px` }}
                />
            }    
        } else {
            return null
        }
    }, [cellStyles.cellIcon?.icon, context.server.RESOURCE_URL]);

    const [Component, extraProps] = useMemo(() => {
        switch (columnMetaData?.cellEditor.className) {
            case CELLEDITOR_CLASSNAMES.CHECKBOX:
            case CELLEDITOR_CLASSNAMES.CHOICE:
                return [ DirectCellRenderer ]
            case CELLEDITOR_CLASSNAMES.DATE:
                return [ DateCellRenderer, {stateCallback: () => { 
                    //setWaiting(true); 
                    setEdit(true) 
                }} ]
            case CELLEDITOR_CLASSNAMES.IMAGE:
                return [ ImageCellRenderer ]
            case CELLEDITOR_CLASSNAMES.LINKED:
                return [ LinkedCellRenderer, {stateCallback: () => { 
                    //setWaiting(true);
                    setEdit(true) 
                }, decreaseCallback: (linkDatabook:string) => props.removeTableLinkRef ? props.removeTableLinkRef(linkDatabook) : undefined}]
            case CELLEDITOR_CLASSNAMES.NUMBER:
                return [ NumberCellRenderer ]
            case CELLEDITOR_CLASSNAMES.TEXT:
                return [ TextCellRenderer ]
            default:
                return [(props:any) => <span className="cell-data-content">{props.cellData}</span>]
        }
    }, [columnMetaData?.cellEditor.className])

    const handleDoubleClick = useCallback(() => {
        if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1) {
            //setWaiting(true);
            setEdit(true)
        }
    }, [
        //setWaiting, 
        setEdit
    ]);

    useEffect(() => {
        props.setIsEditing(edit);
    }, [edit])
    
    useEffect(() => {
        if (!props.tableIsSelecting && storedClickEvent) {
            storedClickEvent();
            setStoredClickEvent(undefined);
        }
    }, [props.tableIsSelecting, storedClickEvent]);

    /** Either return the correctly rendered value or a in-cell editor when readonly is true don't display an editor*/
    return (
        (columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
            ((edit && 
              //!waiting && 
              isEditable) ?
                <div style={{ width: "100%", height: "100%", marginLeft: calcMarginLeft, marginTop: calcMarginTop }} ref={wrapperRef}>
                    {displayEditor(columnMetaData, {...props, isReadOnly: !isEditable}, stopCellEditing, passRef.current)}
                </div>
                :
                <div
                    style={cellStyles.cellStyle}
                    className={cellStyles.cellClassNames.join(' ') + " " + isEditable}
                    onClick={() => {
                        if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1) {
                            setStoredClickEvent(() => {
                                //setWaiting(true);
                                setEdit(true);
                            });
                        }
                    }}>
                    <Component icon={icon} columnMetaData={columnMetaData!} {...props} {...extraProps} />
                </div>
            ) : (edit && isEditable ?
                <div style={{ width: "100%", height: "100%", marginLeft: calcMarginLeft, marginTop: calcMarginTop }} ref={wrapperRef}>
                    {displayEditor(columnMetaData, { ...props, isReadOnly: !isEditable }, stopCellEditing, passRef.current)}
                </div>
                :
                <div
                    style={cellStyles.cellStyle}
                    className={cellStyles.cellClassNames.join(' ')}
                    onDoubleClick={() => setStoredClickEvent(() => handleDoubleClick())}>
                    <Component icon={icon} columnMetaData={columnMetaData!} {...props} {...extraProps} />
                </div>
            )
    )
}
