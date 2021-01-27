import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import { AutoComplete } from 'primereact/autocomplete';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { createFetchRequest, createFilterRequest } from "../../../factories/RequestFactory";
import REQUEST_ENDPOINTS from "../../../request/REQUEST_ENDPOINTS";
import useDataProviderData from "../../zhooks/useDataProviderData";
import * as _ from 'underscore'
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

interface ICellEditorLinked extends ICellEditor{
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
    preferredEditorMode?: number
}

export interface IEditorLinked extends IEditor{
    cellEditor: ICellEditorLinked
}

const UIEditorLinked: FC<IEditorLinked> = (baseProps) => {

    const inputRef = useRef(null)
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorLinked>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const [providedData] = useDataProviderData(compId, baseProps.id, props.cellEditor.linkReference.referencedDataBook||"");
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();
    const autoFocus = props.autoFocus ? true : false;
    const [text, setText] = useState(selectedRow)
    const [firstRow, setFirstRow] = useState(0);
    const [lastRow, setLastRow] = useState(100);
    const [itemHeight, setItemHeight] = useState(0);
    const {onLoadCallback, id} = baseProps;
    const alignments = checkCellEditorAlignments(props);

    useLayoutEffect(() => {
        if(onLoadCallback && inputRef.current){
            // @ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), inputRef.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useLayoutEffect(() => {
        const autoRef:any = inputRef.current
        if (autoRef) {
            autoRef.inputEl.style.setProperty('background', props.cellEditor_background_);
            autoRef.inputEl.style.setProperty('text-align', alignments.ha);
            autoRef.dropdownButton.element.tabIndex = -1;
        }
    },[props.cellEditor_editable_, props.cellEditor_background_, alignments.ha]);

    useEffect(() => {
        setText(selectedRow);
        lastValue.current = selectedRow;
    }, [selectedRow])

    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    //@ts-ignore
                    if (autoPanel.children[0].children[0]) {
                        //@ts-ignore
                        autoPanel.children[0].style.height = Math.ceil(providedData.length * parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height))+'px';
                        if(itemHeight === 0) {
                            //@ts-ignore
                            setItemHeight(parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height))
                        }
                    }
                }
            }, 150);
        }
    },[providedData, id, itemHeight]);

    useEffect(() => {
        if (inputRef.current) {
            setTimeout(() => {
                let autoPanel = document.getElementsByClassName("p-autocomplete-panel")[0];
                if (autoPanel) {
                    let itemsList:Array<any> = [...document.getElementsByClassName("p-autocomplete-item")];
                    itemsList.map(element => element.style.top = (parseFloat(window.getComputedStyle(autoPanel.children[0].children[0]).height) * firstRow)+'px');
                }
            }, 150)
        }
    }, [firstRow, lastRow])

    useEffect(() => {
        const sendFetchRequest = () => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = props.cellEditor.linkReference.referencedDataBook;
            fetchReq.fromRow = providedData.length;
            fetchReq.rowCount = 400;
            context.server.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH)
        }
        const fetches = _.once(() => sendFetchRequest());
        const handleScroll = (elem:HTMLElement) => {
            if (elem) {
                elem.onscroll = _.debounce(() => {
                    let currFirstItem = elem.scrollTop / itemHeight;
                    let currLastItem = (elem.scrollTop + elem.offsetHeight) / itemHeight;
                    if (currFirstItem < firstRow) {
                        setFirstRow(Math.floor(currFirstItem / 50) * 50);
                        setLastRow(Math.floor(currFirstItem / 50) * 50 + 100);
                        elem.scrollTop = itemHeight * (currLastItem - 3);
                    }
                    if (currLastItem > lastRow) {
                        setFirstRow(Math.floor(currLastItem / 100) * 100);
                        setLastRow(Math.ceil(currLastItem / 100) * 100);
                        elem.scrollTop = itemHeight * (currFirstItem + 3)
                    }
                    if (providedData.length < (currFirstItem+400) && !context.contentStore.dataProviderFetched.get(compId)?.get(props.cellEditor.linkReference.referencedDataBook || "")) {
                        fetches();
                    }
                }, 150);
            }
        }
        setTimeout(() => {
            handleScroll(document.getElementsByClassName("p-autocomplete-panel")[0] as HTMLElement)
        },150);
    }, [context.contentStore, context.server, props, providedData, firstRow, lastRow, itemHeight, compId])

    useEffect(() => {
        if (inputRef.current) {
            //@ts-ignore
            inputRef.current.inputEl.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleInput();
                }
            }
        }
    });

    useEffect(() => {
        return () => {
            if (props.id === "") {
                if (text !== null)
                onBlurCallback(baseProps, text ? text[props.columnName] : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text ? text : null, lastValue.current, context.server));
            }
        }
    },[text, baseProps, context.server, props.cellEditor, props.columnName, props.dataRow, props.id, props.name]);

    const suggestionData = useMemo(() => {
        return providedData ? providedData.slice(firstRow, lastRow) : []
    }, [providedData, firstRow, lastRow])

    const handleInput = () => {
        const newVal:any = {}
        const foundData = providedData.filter(data => {
            if (props.cellEditor) {
                const refColNames = props.cellEditor.linkReference.referencedColumnNames
                const colNames = props.cellEditor.linkReference.columnNames
                const index = colNames.findIndex(col => col === props.columnName)
                if (typeof text === "string") {
                    return data[refColNames[index]].includes(text)
                }
                else if (typeof text === "object" && text !== null) {
                    return data[refColNames[index]] === text[colNames[index]]
                }
            }
            return false
        });
        if (!text) {
            onBlurCallback(baseProps, null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, null, lastValue.current, context.server));
        }
        else if (foundData.length === 1) {                
            if (props.cellEditor) {
                if (props.cellEditor.linkReference.columnNames.length > 1) {
                    for (let i = 0; i < Object.values(foundData[0]).length; i++) {
                        newVal[props.cellEditor.linkReference.columnNames[i]] = Object.values(foundData[0])[i];                    }
                    onBlurCallback(baseProps, newVal[props.columnName], lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, newVal, lastValue.current, context.server));
                }
                else
                    onBlurCallback(baseProps, text, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.cellEditor.linkReference.columnNames, text, lastValue.current, context.server));
            }
                
                
        }
        else {
            setText(lastValue.current)
        }
    }

    const buildSuggestions = (response:any) => {
        let suggestions:any = []
        if (response.length > 0) {
            response.forEach((record:any) => {
                let text = ""
                if (props.cellEditor) {
                    text = props.cellEditor.columnView ? record[props.cellEditor.columnView.columnNames[0]] : 
                    (props.cellEditor.linkReference.referencedColumnNames.length > 1 ? record[props.cellEditor.linkReference.referencedColumnNames[1]] : record[props.cellEditor.linkReference.referencedColumnNames[0]])
                }
                    
                suggestions.push(text)
            });
        }
        return suggestions
    }

    const onInputChange = (event:any) => {
        context.contentStore.clearDataFromProvider(compId, props.cellEditor.linkReference.referencedDataBook||"")
        const filterReq = createFilterRequest()
        filterReq.dataProvider = props.cellEditor.linkReference?.referencedDataBook;
        filterReq.editorComponentId = props.name;
        filterReq.value = event.query;
        context.server.sendRequest(filterReq, REQUEST_ENDPOINTS.FILTER);
    }

    return (
        <AutoComplete
            autoFocus={autoFocus}
            appendTo={document.body}
            ref={inputRef}
            className="rc-editor-linked"
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            disabled={!props.cellEditor_editable_}
            dropdown
            completeMethod={onInputChange}
            suggestions={buildSuggestions(suggestionData)}
            value={text}
            onChange={event => {
                setText(event.target.value)
            }}
            onBlur={() => {
                if (document.querySelector(".p-autocomplete-panel")) {
                    (document.querySelector(".p-autocomplete-dropdown") as HTMLElement).click()
                    setFirstRow(0);
                    setLastRow(100)
                }
                handleInput();
            }}/>
    )
}
export default UIEditorLinked