/** React imports */
import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

/** 3rd Party imports */
import _ from "underscore";

/** Hook imports */
import { 
    useOutsideClick, 
    useEventHandler,
    useMetaData,
} from "../zhooks";

/** Other imports */
import { appContext } from "../../AppProvider";
import { cellRenderer, displayEditor } from "./CellDisplaying";
import { getFont, IconProps, parseIconData } from "../compprops";
import { CELLEDITOR_CLASSNAMES } from "../editors";
import { SelectedCellContext } from "./UITable";

export interface CellFormatting {
    foreground?: string;
    background?: string;
    font?: string;
    image?: string;
}

/** Type for CellEditor */
type CellEditor = {
    pk: any,
    compId: string,
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
    readonly?: boolean,
    tableEnabled?: boolean
    cellFormatting?: CellFormatting,
    startEditing?:boolean,
    stopEditing:Function
}

/**
 * This component displays either just the value of the cell or an in-cell editor
 * @param props - props received by Table
 */
export const CellEditor: FC<CellEditor> = (props) => {
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
    const columnMetaData = useMetaData(props.compId, props.dataProvider, props.colName)

    /** State if the CellEditor is currently waiting for the selectedRow */
    const [waiting, setWaiting] = useState<boolean>(false);

    const showDropDownArrow = useCallback(() => {
        if (columnMetaData?.cellEditor.className === CELLEDITOR_CLASSNAMES.LINKED
            || columnMetaData?.cellEditor.className === CELLEDITOR_CLASSNAMES.DATE) {
            return true;
        }
        return false;
    }, [columnMetaData])

    /** When a new selectedRow is set, set waiting to false and if edit is false reset the passRef */
    useEffect(() => {
        if (props.selectedRow) {
            if (!edit) {
                passRef.current = "";
            }
            const pickedVals = _.pick(props.selectedRow.data, Object.keys(props.pk));
            if (waiting && _.isEqual(pickedVals, props.pk)) {
                setWaiting(false);
            }
        }
    }, [props.selectedRow, edit])

    /** Whenn the selected cell changes and the editor is editable close it */
    useEffect(() => {
        if (cellContext.selectedCellId !== props.cellId().selectedCellId) {
            if (edit) {
                setEdit(false);
                props.stopEditing()
            }
        }
    }, [cellContext.selectedCellId]);

    useEffect(() => {
        if (cellContext.selectedCellId === props.cellId().selectedCellId && props.startEditing) {
            setEdit(true);
        }
    },[props.startEditing])

    /**
     * Callback for stopping the cell editing process, closes editor and based on keyboard input, selects the next or previous cell/row
     * @param event - the KeyboardEvent
     */
    const stopCellEditing = useCallback((event?:KeyboardEvent) => {
        setEdit(false);
        props.stopEditing()
        if (event) {
            if (event.key === "Enter") {
                if (event.shiftKey) {
                    selectPrevious(enterNavigationMode);
                }
                else {
                    selectNext(enterNavigationMode);
                }
            }
            else if (event.key === "Tab") {
                event.preventDefault();
                if (event.shiftKey) {
                    selectPrevious(tabNavigationMode);
                }
                else {
                    selectNext(tabNavigationMode);
                }
            }
        }
        else {
            selectNext(enterNavigationMode);
        }
        tableContainer.focus()
    }, [setEdit, selectNext, selectPrevious, enterNavigationMode, tabNavigationMode]);

    /** Hook which detects if there was a click outside of the element (to close editor) */
    useOutsideClick(wrapperRef, () => { setEdit(false); props.stopEditing() }, columnMetaData);

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
                    if (event.key.length === 1) {
                        passRef.current = event.key;
                        setEdit(true);
                    }
            }
        }
    }, [cellContext.selectedCellId, setEdit])

    /** Adds Keylistener to the tableContainer */
    useEventHandler(tableContainer, "keydown", (e:any) => handleCellKeyDown(e));

    let cellStyle:any = { };
    const cellClassNames:string[] = ['cell-data', typeof props.cellData === "string" && (props.cellData as string).includes("<html>") ? "html-cell" : ""];
    let cellIcon: IconProps | null = null;

    if (props.cellFormatting) {
        if(props.cellFormatting.background) {
            cellStyle.backgroundColor = props.cellFormatting.background;
            cellClassNames.push('cancel-padding');
        }
        if(props.cellFormatting.foreground) {
            cellStyle.color = props.cellFormatting.foreground;
        }
        if(props.cellFormatting.font) {
            const font = getFont(props.cellFormatting.font);
            cellStyle = {
                ...cellStyle,
                fontFamily: font ? font.fontFamily : undefined,
                fontWeight: font ? font.fontWeight : undefined,
                fontStyle: font ? font.fontStyle : undefined,
                fontSize: font ? font.fontSize : undefined
            }
        }
        if(props.cellFormatting.image) {
            cellIcon = parseIconData(props.cellFormatting.foreground, props.cellFormatting.image);
        }
    }

    const icon = useMemo(() => {
        if (cellIcon?.icon) {
            if(cellIcon.icon.includes('fas fa-') || cellIcon.icon.includes('far fa-') || cellIcon.icon.includes('fab fa-'))
                return <i className={cellIcon.icon} style={{ fontSize: cellIcon.size?.height, color: cellIcon.color}}/>
            else {
                return <img
                    id={props.name}
                    alt="icon"
                    src={context.server.RESOURCE_URL + cellIcon.icon}
                    style={{width: `${cellIcon.size?.width}px`, height: `${cellIcon.size?.height}px` }}
                />
            }    
        } else {
            return null
        }
    }, [cellIcon?.icon, context.server.RESOURCE_URL]);

    /** Either return the correctly rendered value or a in-cell editor when readonly is true don't display an editor*/
    return (
        (!props.readonly && props.tableEnabled !== false) ?
            (columnMetaData?.cellEditor?.directCellEditor || columnMetaData?.cellEditor?.preferredEditorMode === 1) ?
                ((edit && !waiting) ?
                    <div style={{width: "100%", height: "100%"}} ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>
                    :
                    <div
                        style={cellStyle}
                        className={cellClassNames.join(' ')}
                        onClick={() => {
                            if (columnMetaData?.cellEditor?.className !== "ImageViewer" && !columnMetaData?.cellEditor?.directCellEditor) {
                                setWaiting(true);
                                setEdit(true);
                            }
                        }}>
                        {icon ?? cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale, () => { setWaiting(true); setEdit(true) })}
                        {showDropDownArrow() && <i className="pi pi-chevron-down cell-editor-arrow" style={{ marginLeft: "auto" }} />}
                    </div>
                ) : (!edit ?
                    <div
                        style={cellStyle}
                        className={cellClassNames.join(' ')}
                        onDoubleClick={() => columnMetaData?.cellEditor?.className !== "ImageViewer" ? setEdit(true) : undefined}>
                        <div className="cell-data-content">
                            {icon ?? cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale, () => setEdit(true))}
                        </div>
                        {showDropDownArrow() &&
                            <div style={{ marginLeft: "auto" }} tabIndex={-1} onClick={() => { setWaiting(true); setEdit(true) }} >
                                <i className="pi pi-chevron-down cell-editor-arrow" />
                            </div>}
                    </div>
                    :
                    <div style={{width: "100%", height: "100%"}} ref={wrapperRef}>
                        {displayEditor(columnMetaData, props, stopCellEditing, passRef.current)}
                    </div>)
            : <div
                style={cellStyle}
                className={cellClassNames.join(' ')}>
                {icon ?? cellRenderer(columnMetaData, props.cellData, props.resource, context.appSettings.locale)}
                {showDropDownArrow() && <i className="pi pi-chevron-down cell-editor-arrow" style={{ marginLeft: "auto" }} />}
            </div>
    )
}
