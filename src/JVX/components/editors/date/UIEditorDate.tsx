import React, {FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {Calendar} from 'primereact/calendar';
import {ICellEditor, IEditor} from "../IEditor";
import {LayoutContext} from "../../../LayoutContext";
import useProperties from "../../zhooks/useProperties";
import useRowSelect from "../../zhooks/useRowSelect";
import {jvxContext} from "../../../jvxProvider";
import {sendSetValues} from "../../util/SendSetValues";
import { parseDateFormatCell, parseDateFormatTable } from "../../util/ParseDateFormats";
import { onBlurCallback } from "../../util/OnBlurCallback";
import { checkCellEditorAlignments } from "../../compprops/CheckAlignments";
import { sendOnLoadCallback } from "../../util/sendOnLoadCallback";
import moment from "moment";
import { parseJVxSize } from "../../util/parseJVxSize";
import { getEditorCompId } from "../../util/GetEditorCompId";

interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
    preferredEditorMode?: number
}

export interface IEditorDate extends IEditor{
    cellEditor: ICellEditorDate
}

const UIEditorDate: FC<IEditorDate> = (baseProps) => {

    const calender = useRef(null);
    const context = useContext(jvxContext);
    const layoutValue = useContext(LayoutContext);
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);
    const compId = getEditorCompId(props.id, context.contentStore, props.dataRow);
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);
    const lastValue = useRef<any>();
    const lastChange = useRef<any>(selectedRow);
    const {onLoadCallback, id} = baseProps;
    const dateFormat = useMemo(() => parseDateFormatCell(props.cellEditor.dateFormat, selectedRow), [selectedRow, props.cellEditor.dateFormat]);
    const checkCharsInFormat = (format:string, chars:string[], include:boolean) => {
        const replacedFormat = format.replaceAll(/'.*?'/g, '')
        return include ? chars.some(el => replacedFormat.includes(el)) : !chars.some(el => replacedFormat.includes(el))
    }
    const showTime = checkCharsInFormat(props.cellEditor.dateFormat as string, ['H', 'k', 'K', 'h', 'm', 's', 'S'], true);
    const showSeconds = checkCharsInFormat(props.cellEditor.dateFormat as string, ['s'], true);
    const showMillisec = checkCharsInFormat(props.cellEditor.dateFormat as string, ['S'], true);
    const timeOnly = checkCharsInFormat(props.cellEditor.dateFormat as string, ['G', 'y', 'Y', 'M', 'w', 'W', 'D', 'd', 'F', 'E', 'u'], false);

    const onSelectCallback = (submitValue:any) => {
        if (Array.isArray(submitValue)) {
            let tempArray:Array<number> = [];
            submitValue.forEach(date => {
                tempArray.push(date.getTime())
            })
            onBlurCallback(baseProps, tempArray, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, tempArray, lastValue.current, context.server));
        }
        else
            onBlurCallback(baseProps, submitValue ? submitValue.getTime() : null, lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, submitValue ? submitValue.getTime() : null, lastValue.current, context.server));
    }

    useLayoutEffect(() => {
        //@ts-ignore
        if (calender.current.container !== null) {
            const alignments = checkCellEditorAlignments(props)
            //@ts-ignore
            for (let child of calender.current.container.children) {
                if (child.tagName === 'INPUT') {
                    child.style.setProperty('background', props.cellEditor_background_)
                    child.style.setProperty('text-align', alignments?.ha)
                }
            }
        }
    });

    useLayoutEffect(() => {
        if (onLoadCallback && calender.current) {
            //@ts-ignore
            sendOnLoadCallback(id, parseJVxSize(props.preferredSize), parseJVxSize(props.maximumSize), parseJVxSize(props.minimumSize), calender.current.container, onLoadCallback)
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        lastValue.current = selectedRow;
    },[selectedRow])

    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY HH:mm", "DD-MM-YYYY HH:mm", "DD/MM/YYYY HH:mm", "DD.MMMMM.YY HH:mm", "DD-MMMMM-YYYY HH:mm", "DD/MMMM/YYYYY HH:mm", "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        else {
            //@ts-ignore
            inputDate = moment(calender.current.inputElement.value, [parseDateFormatTable(props.cellEditor.dateFormat, new Date(selectedRow).getTime()), "DD.MM.YYYY", "DD-MM-YYYY", "DD/MM/YYYY", "DD.MMMMM.YY", "DD-MMMMM-YYYY", "DD/MMMM/YYYYY"]).toDate();
        }
        onBlurCallback(baseProps, inputDate.getTime(), lastValue.current, () => sendSetValues(props.dataRow, props.name, props.columnName, inputDate.getTime(), lastValue.current, context.server));
    }

    const removePrimeTime = (value:string) => {
        if (showMillisec && showSeconds)
            return value.substring(0, value.length - 13);
        else if (showMillisec && !showSeconds)
            return value.substring(0, value.length - 7);
        else if (showSeconds)
            return value.substring(0, value.length - 9);
        else
            return value.substring(0, value.length - 6);
    }

    useEffect(() => {
        if (calender.current) {
            //@ts-ignore
            calender.current.inputElement.onkeydown = (event:React.KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    handleDateInput()
                }
            }
            if (timeOnly) {
                //@ts-ignore
                calender.current.inputElement.value = dateFormat.replaceAll("'", '')
            }
            else if (showTime) {
                //@ts-ignore
                calender.current.inputElement.value = removePrimeTime(calender.current.inputElement.value);
            }
        }
    });

    return(
        <Calendar
            ref={calender}
            className="rc-editor-text"
            monthNavigator={true}
            yearNavigator={true}
            yearRange="1900:2030"
            dateFormat={dateFormat}
            showTime={showTime}
            showSeconds={showSeconds}
            showMillisec={showMillisec}
            timeOnly={timeOnly}
            showIcon={true}
            style={layoutValue.get(props.id) || baseProps.editorStyle}
            value={new Date(selectedRow)}
            appendTo={document.body}
            onSelect={event => onSelectCallback(event.value)}
            onBlur={handleDateInput}
            onChange={(e) => {
                console.log(e)
                if (calender.current && showTime) {
                    setTimeout(() => {
                        if (e.value !== null && lastChange.current === (e.value as Date).getTime()) {
                            //@ts-ignore
                            calender.current.inputElement.value = removePrimeTime(calender.current.inputElement.value);
                        }
                    },0)
                }
                setTimeout(() => {
                    if (e.value !== null)
                        lastChange.current = (e.value as Date).getTime()
                }, 0)
            }}
            disabled={!props.cellEditor_editable_}
        />
    )
}
export default UIEditorDate