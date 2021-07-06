/** React imports */
import React, { FC, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { AutoComplete } from 'primereact/autocomplete';

/** Hook imports */
import { useProperties, useRowSelect, useDataProviderData, useEventHandler, useLayoutValue, useFetchMissingData} from "../../zhooks"

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../../request";
import { getTextAlignment } from "../../compprops";
import { getEditorCompId, parsePrefSize, parseMinSize, parseMaxSize, sendOnLoadCallback, sendSetValues, onBlurCallback, handleEnterKey} from "../../util";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";

/** Interface for cellEditor property of LinkedCellEditor */
export interface ICellEditorLinked extends ICellEditor{
    linkReference: {
        referencedDataBook: string
        columnNames: string[]
        referencedColumnNames: string[]
    }
    columnView: {
        columnCount: number
        columnNames: Array<string>
        rowDefinitions: Array<any>

    }
    clearColumns:Array<string>
    displayReferencedColumnName?:string
}

/** Interface for LinkedCellEditor */
export interface IEditorLinked extends IEditor{
    cellEditor: ICellEditorLinked
}

/**
 * This component displays an input field with a button which provides a dropdownlist with values of a databook
 * when text is entered into the inputfield, the dropdownlist gets filtered
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorLinked: FC<IEditorLinked> = (baseProps) => {
    /** Reference for the LinkedCellEditor element */
    const linkedRef = useRef<any>(null);

    /** Reference for the LinkedCellEditor input element */
    const linkedInput = useRef<any>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, baseProps.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The data provided by the databook */
    const [providedData] = useDataProviderData(compId, props.cellEditor.linkReference.referencedDataBook||"");

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Current state of text value of input element */
    const [text, setText] = useState(selectedRow);

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    useFetchMissingData(compId, props.dataRow);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if(onLoadCallback && linkedRef.current){
            // @ts-ignore
            sendOnLoadCallback(id, parsePrefSize(props.preferredSize), parseMaxSize(props.maximumSize), parseMinSize(props.minimumSize), linkedRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    /** When selectedRow changes set the state of inputfield value to selectedRow and update lastValue reference */
    useEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    }, [selectedRow]);

    /** disable dropdownbutton tabIndex */
    useEffect(() => {
        const autoRef: any = linkedRef.current
        if (autoRef) {
            autoRef.dropdownButton.tabIndex = -1;
        }

        if (isCellEditor && props.passedKey) {
            setText("");
        }
    }, []);

    /**
     * When the input changes, send a filter request to the server
     * @param event - Event that gets fired on inputchange
     */
    const sendFilter = useCallback(async (value:any) => {
        context.contentStore.clearDataFromProvider(compId, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = value;

        if (isCellEditor) {
            filterReq.columnNames = [baseProps.columnName]
        }
        await context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }, [context.contentStore, context.server, props.cellEditor, props.name])

    useEffect(() => {
        setTimeout(() => {
            if(linkedRef.current && props.cellEditor.autoOpenPopup && ((props.cellEditor.preferredEditorMode === 1 || props.cellEditor.directCellEditor) && isCellEditor)) {
                sendFilter("");
                (linkedRef.current as any).showOverlay();
            }
        }, 33)

    }, [props.cellEditor.autoOpenPopup, props.cellEditor.directCellEditor, props.cellEditor.preferredEditorMode, isCellEditor, sendFilter])

    /**
     * When enter is pressed "submit" the value
     */
    useEventHandler(linkedInput.current || undefined, "keydown", (event) => {
        event.stopPropagation();
        if((event as KeyboardEvent).key === "Enter") {
            (linkedRef.current as any).hideOverlay();
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
        }
        else if (isCellEditor && props.stopCellEditing) {
            if ((event as KeyboardEvent).key === "Tab") {
                (event.target as HTMLElement).blur()
                props.stopCellEditing(event);
            }
            else if ((event as KeyboardEvent).key === "Escape") {
                props.stopCellEditing(event)
            }
        }
    });

    /**
     * Handles the input, when the text is entered manually or via the dropdown menu and sends the value to the server
     * if the corresponding row is found in its databook. if it isn't, the state is set back to its previous value
     */
    const handleInput = () => {
        const newVal:any = {}
        const linkReference = props.cellEditor.linkReference;
        
        const refColNames = linkReference.referencedColumnNames;
        const colNames = linkReference.columnNames;
        const index = colNames.findIndex(col => col === props.columnName);
    
        /** Returns the values, of the databook, that match the input of the user */
        let foundData = providedData.some((data: any) => data[refColNames[index]] === text) ?
            providedData.find((data: any) => data[refColNames[index]] === text) :
            providedData.filter((data: any) => {
                if (props.cellEditor) {
                    if (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1 && props.cellEditor.displayReferencedColumnName) {
                        return data[props.cellEditor.displayReferencedColumnName].includes(text);
                    }
                    else {
                        return data[refColNames[index]].includes(text);
                    }

                }
                return false
            });

        foundData = Array.isArray(foundData) ? foundData : [foundData];

        const columnNames = (linkReference.columnNames.length === 0 && linkReference.referencedColumnNames.length === 1) ? props.columnName : linkReference.columnNames

        /** If the text is empty, send null to the server */
        if (!text) {
            onBlurCallback(baseProps, null, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, null, context.server), topbar));
        }
        /** If there is a match found send the value to the server */
        else if (foundData.length === 1) {                
            if (props.cellEditor) {
                if (linkReference.columnNames.length > 1) {
                    /** 
                     * Columnnames in linkReference and foundData are not the same they need to be properly set to be sent to the server
                     * Example: linkReference.columnNames = ACTI_ID, ACTI_ACADEMIC_TITLE
                     *          foundData = ID, ACADEMIC_TITLE
                     * foundData columnNames have to be adjusted to linkReference
                     */
                    for (let i = 0; i < Object.values(foundData[0]).length; i++) {
                        newVal[linkReference.columnNames[i]] = Object.values(foundData[0])[i];
                    }
                    if (newVal[props.columnName] === lastValue.current) {
                        setText(lastValue.current)
                    }
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, newVal, context.server), topbar));
                }
                /** If there is no more than 1 columnName in linkReference, text is enough */
                else {
                    onBlurCallback(baseProps, text, lastValue.current, () => showTopBar(sendSetValues(props.dataRow, props.name, columnNames, text, context.server), topbar));
                }
                    
            }
        
        }
        /** If there is no match found set the old value */
        else {
            setText(lastValue.current)
        }
    }

    /**
     * Returns the suggestions to display at the dropdownlist
     * @param values - The values which should be suggested
     * @returns the suggestions to display at the dropdownlist
     */
    const buildSuggestions = (values:any) => {
        let suggestions:any = []
        if (values.length > 0) {
            values.forEach((value:any) => {
                let text = ""
                if (props.cellEditor) {
                    if (props.cellEditor.displayReferencedColumnName) {
                        text = value[props.cellEditor.displayReferencedColumnName]
                    }
                    else {
                        const colNameIndex = props.cellEditor.linkReference.columnNames.findIndex(columnName => columnName === props.columnName);
                        text = value[props.cellEditor.linkReference.referencedColumnNames[colNameIndex]];
                    }
                } 
                suggestions.push(text)
            });
        }
        return suggestions
    }

    const handleLazyLoad = (event:any) => {
        if (event.last >= providedData.length && !context.contentStore.dataProviderFetched.get(compId)?.get(props.cellEditor.linkReference.referencedDataBook || "")) {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
        }
    }

    return (
        <AutoComplete
            ref={linkedRef}
            id={props.id !== "" ? props.name : undefined}
            inputRef={linkedInput}
            autoFocus={props.autoFocus ? true : isCellEditor ? true : false}
            appendTo={document.body}
            className="rc-editor-linked"
            style={layoutStyle}
            scrollHeight={(providedData.length * 33) > 200 ? "200px" : `${providedData.length * 33}px`}
            inputStyle={{...textAlignment, background: props.cellEditor_background_, borderRight: "none"}}
            disabled={!props.cellEditor_editable_}
            dropdown
            completeMethod={(event) =>  sendFilter(event.query)}
            suggestions={buildSuggestions(providedData)}
            value={text}
            onChange={event => setText(event.target.value)}
            onBlur={() => handleInput()}
            virtualScrollerOptions={{ itemSize: 33, lazy: true, onLazyLoad: handleLazyLoad }}/>
    )
}
export default UIEditorLinked