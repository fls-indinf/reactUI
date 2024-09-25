/* Copyright 2023 SIB Visions GmbH
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

import React, { CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import CELLEDITOR_CLASSNAMES from "../../editors/CELLEDITOR_CLASSNAMES"
import DirectCellRenderer from "./DirectCellRenderer"
import ImageCellRenderer from "./ImageCellRenderer"
import DateCellRenderer from "./DateCellRenderer"
import LinkedCellRenderer from "./LinkedCellRenderer"
import NumberCellRenderer from "./NumberCellRenderer"
import TextCellRenderer from "./TextCellRenderer"
import { isFAIcon } from "../../../hooks/event-hooks/useButtonMouseImages"
import { appContext } from "../../../contexts/AppProvider"
import useMetaData from "../../../hooks/data-hooks/useMetaData"
import IconProps from "../../comp-props/IconProps"
import { CellFormatting } from "../CellEditor"
import { getFont, parseIconData } from "../../comp-props/ComponentProperties"
import { SelectedCellContext } from "../UITable"
import { classNames } from "primereact/utils"
import { concatClassnames } from "src/main/util/string-util/ConcatClassnames"
import Margins from "../../layouts/models/Margins"

/** Interfaces for cellrenderers */
export interface ICellRenderer {
    name:string
    screenName: string,
    cellData: any,
    cellId: string,
    dataProvider: string,
    colName: string,
    colIndex: number,
    primaryKeys: string[],
    rowData: any,
    rowNumber: number,
    cellFormatting?: Map<string, CellFormatting>,
    isHTML: boolean,
    setStoredClickEvent?: (value: React.SetStateAction<Function | undefined>) => void
    setEdit?: (value: React.SetStateAction<boolean>) => void,
    decreaseCallback?: Function|undefined,
    isEditable: boolean,
    addReadOnlyClass: boolean,
    cellClickEvent: string,
    setCellClickEvent: (cellId: string) => void
}

const CellRenderer: FC<ICellRenderer> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Context for the selected cell */
    const cellContext = useContext(SelectedCellContext);

    /** Metadata of the columns */
    const columnMetaData = useMetaData(props.screenName, props.dataProvider, props.colName);

    /** Reference for the cell element */
    const cellRef = useRef<any>(null);

    /** adds or removes the readonly className to the cells parent */
    useLayoutEffect(() => {
        if (cellRef.current && cellRef.current.parentElement) {
            if (!props.addReadOnlyClass && cellRef.current.parentElement.classList.contains("cell-readonly")) {
                cellRef.current.parentElement.classList.remove("cell-readonly");
            }
            else if (props.addReadOnlyClass && !cellRef.current.parentElement.classList.contains("cell-readonly")) {
                cellRef.current.parentElement.classList.add("cell-readonly")
            }
        }
    }, [props.addReadOnlyClass])

    /** Contains the cell-style extracted from the cellformatting property */
    const cellStyles: { cellStyle: CSSProperties, cellClassNames: string[], cellIcon: IconProps | null } = useMemo(() => {
        let cellStyle:any = { };
        const cellClassNames:string[] = ['cell-data', props.isHTML ? "html-cell" : ""];
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

                if (cellFormat.style) {
                    cellClassNames.push(cellFormat.style);
                }

                if (cellFormat.leftIndent) {
                    cellStyle = {
                        ...cellStyle,
                        marginLeft: cellFormat.leftIndent
                    }
                }

            }
        }

        return { cellStyle: cellStyle, cellClassNames: cellClassNames, cellIcon: cellIcon }
    }, [props.cellFormatting, props.colName])

    // Returns the cell-icon as icon if FontAwesome, image element or null
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

    /** Returns the correct renderer component based on the celleditor datatype and the respective properties */
    const [Renderer, rendererProps] = useMemo(() => {
        switch (columnMetaData?.cellEditor.className) {
            case CELLEDITOR_CLASSNAMES.CHECKBOX:
            case CELLEDITOR_CLASSNAMES.CHOICE:
                return [ DirectCellRenderer, {filter: { columnNames: props.primaryKeys, values: props.primaryKeys.map(pk => props.rowData[pk]) }} ]
            case CELLEDITOR_CLASSNAMES.DATE:
                return [DateCellRenderer, {
                    stateCallback: () => {
                        if (props.setEdit) {
                            //setWaiting(true);
                            props.setEdit(true)
                        }
                    }
                }]
            case CELLEDITOR_CLASSNAMES.IMAGE:
                return [ ImageCellRenderer ]
            case CELLEDITOR_CLASSNAMES.LINKED:
                return [ LinkedCellRenderer, {
                    stateCallback: () => {
                        if (props.setEdit) {
                            //setWaiting(true);
                            props.setEdit(true)
                        }
                    }, 
                    decreaseCallback: props.decreaseCallback }]
            case CELLEDITOR_CLASSNAMES.NUMBER:
                return [ NumberCellRenderer ]
            case CELLEDITOR_CLASSNAMES.TEXT:
                return [ TextCellRenderer ]
            default:
                return [(props:any) => <span className="cell-data-content">{props.cellData}</span>]
        }
    }, [columnMetaData?.cellEditor.className]);

    // When clicking on a celleditor that is not an image or directcelleditor, store the click event to execute later in case of row selection
    const handleClickEvent = useCallback(() => {
        if ([CELLEDITOR_CLASSNAMES.IMAGE, CELLEDITOR_CLASSNAMES.CHECKBOX, CELLEDITOR_CLASSNAMES.CHOICE].indexOf(columnMetaData?.cellEditor.className as CELLEDITOR_CLASSNAMES) === -1 &&
            props.setStoredClickEvent && props.setEdit) {
            props.setStoredClickEvent(() => {
                props.setEdit!(true);
            })
        }
    }, []);

    // Wait for the selected cell switch and then call the click event
    useEffect(() => {
        if (cellContext.selectedCellId === props.cellClickEvent && cellContext.selectedCellId === props.cellId) {
            handleClickEvent();
            props.setCellClickEvent("");
        }
    }, [cellContext.selectedCellId]);

    return (
        <div
            ref={cellRef}
            style={cellStyles.cellStyle}
            className={cellStyles.cellClassNames.join(' ')}
            onMouseUp={(e) => {
                // check if 1 click or double click to open the editor, if the same cell is already selected immediatley call the click event, if not wait for selecting
                if (props.isEditable && ((columnMetaData?.cellEditor.preferredEditorMode === 1 && e.detail === 1) || (columnMetaData?.cellEditor.preferredEditorMode !== 1 && e.detail === 2))) {
                    if (cellContext.selectedCellId === props.cellId) {
                        handleClickEvent();
                    }
                    else {
                        props.setCellClickEvent(props.cellId);
                    }
                }
            }}>
            <Renderer columnMetaData={columnMetaData!} icon={icon} {...props} {...rendererProps} />
        </div>
    )
}
export default CellRenderer