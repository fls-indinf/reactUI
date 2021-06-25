/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import { Calendar } from 'primereact/calendar';
import { format, parse, isValid, formatISO, startOfDay } from 'date-fns'

/** Hook imports */
import { useEventHandler, useFetchMissingData, useLayoutValue, useProperties, useRowSelect } from "../../zhooks";

/** Other imports */
import { ICellEditor, IEditor } from "..";
import { appContext } from "../../../AppProvider";
import { getEditorCompId, 
         sendSetValues, 
         onBlurCallback, 
         sendOnLoadCallback, 
         parsePrefSize, 
         parseMinSize, 
         parseMaxSize, 
         getDateLocale,
         setDateLocale,
         handleEnterKey} from "../../util";
import { getTextAlignment } from "../../compprops";
import { showTopBar, TopBarContext } from "../../topbar/TopBar";

/** Interface for cellEditor property of DateCellEditor */
export interface ICellEditorDate extends ICellEditor{
    dateFormat?: string,
    isAmPmEditor: boolean,
    isDateEditor: boolean,
    isHourEditor: boolean,
    isMinuteEditor: boolean,
    isSecondEditor: boolean,
    isTimeEditor: boolean,
}

/** Interface for DateCellEditor */
export interface IEditorDate extends IEditor{
    cellEditor: ICellEditorDate
}

const dateTimeFormats = [
    "dd.MM.yyyy HH:mm", 
    "dd-MM-yyyy HH:mm", 
    "dd/MM/yyyy HH:mm", 
    "dd.MMMMM.yy HH:mm", 
    "dd-MMMMM-yyyy HH:mm", 
    "dd/MMMM/yyyyy HH:mm", 
]

const dateFormats = [
    "dd.MM.yyyy", 
    "dd-MM-yyyy", 
    "dd/MM/yyyy", 
    "dd.MMMMM.yy", 
    "dd-MMMMM-yyyy", 
    "dd/MMMM/yyyyy"
]

const parseMultiple = (
    dateString: string,
    formatString: string[],
    referenceDate: Date,
    options?: Parameters<typeof parse>[3]
) => {
    let result;
    for (let i = 0; i < formatString.length; i++) {
        if(!formatString[i]) continue;
        result = parse(dateString, formatString[i], referenceDate, options);
        if (isValid(result)) { break; }
    }
    return result;
}

/**
 * The DateCellEditor displays an input field to enter a date value and a button
 * which opens a datepicker to choose a date and change the value in its databook
 * @param baseProps - Initial properties sent by the server for this component
 */
const UIEditorDate: FC<IEditorDate> = (baseProps) => {
    /** Reference for the calendar element */
    const calendar = useRef<CustomCalendar>(null);

    /** Reference for calendar input element */
    const calendarInput = useRef<HTMLInputElement>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Current state of the properties for the component sent by the server */
    const [props] = useProperties<IEditorDate>(baseProps.id, baseProps);

    /** get the layout style value */
    const layoutStyle = useLayoutValue(props.id, baseProps.editorStyle);

    /** ComponentId of the screen */
    const compId = getEditorCompId(props.id, context.contentStore);

    /** The current state of either the entire selected row or the value of the column of the selectedrow of the databook sent by the server */
    const [selectedRow] = useRowSelect(compId, props.dataRow, props.columnName);

    const [dateValue, setDateValue] = useState<any>(selectedRow);

    /** Mounted state used because useEventHandler ref is null when cell-editor is opened -> not added */
    const [mounted, setMounted] = useState<boolean>(false)

    const [visible, setVisible] = useState<boolean>(false);

    /** Reference to last value so that sendSetValue only sends when value actually changed */
    const lastValue = useRef<any>();

    /** Extracting onLoadCallback and id from baseProps */
    const {onLoadCallback, id} = baseProps;

    /** Current state of dateFormat for PrimeReact Calendar */
    const dateFormat = props.cellEditor.dateFormat;

    /** The horizontal- and vertical alignments */
    const textAlignment = useMemo(() => getTextAlignment(props), [props]);

    /** Wether the DateCellEditor is a time-editor */
    const showTime = props.cellEditor.isTimeEditor;

    /** Wether the DateCellEditor should show seconds */
    const showSeconds = props.cellEditor.isSecondEditor;

    /** Wether the DateCellEditor should only show time and no date */
    const timeOnly = props.cellEditor.isTimeEditor && !props.cellEditor.isDateEditor;

    /** If the editor is a cell-editor */
    const isCellEditor = props.id === "";

    const alreadySaved = useRef<boolean>(false);

    setDateLocale(context.contentStore.locale);

    useFetchMissingData(compId, props.dataRow);

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        if (onLoadCallback && calendar.current) {
            sendOnLoadCallback(
                id, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                //@ts-ignore
                calendar.current.container, 
                onLoadCallback
            )
        }
    },[onLoadCallback, id, props.preferredSize, props.maximumSize, props.minimumSize]);

    useEffect(() => {
        setMounted(true)
        setTimeout(() => {
            if (calendarInput.current && isCellEditor) {
                calendarInput.current?.focus()
                if (props.passedKey) {
                    //TODO: Value changing isn't very good here but setting the state is not possible because the state needs to be a date...
                    calendarInput.current.value = props.passedKey
                }
            }
        },0);

        return () => handleDateInput();
    },[])

    useEffect(() => {
        setDateValue(new Date(selectedRow));
        lastValue.current = selectedRow;
    },[selectedRow])

    /**
     * When a date is entered in the inputfield in some possible formats, use date-fns parse to get its date object, then call onBlurCallback
     * to send the date to the server and remove PrimeReact time if necassary
     */
    const handleDateInput = () => {
        let inputDate:Date = new Date()
        if (showTime) {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateTimeFormats,
                ...dateFormats
            ], new Date(), { locale: getDateLocale() });
        }
        else {
            //@ts-ignore
            inputDate = parseMultiple(calendarInput.current.value, [
                props.cellEditor.dateFormat || '', 
                ...dateFormats
            ], new Date(), { locale: getDateLocale() });
        }

        const isValidDate = inputDate instanceof Date && !isNaN(inputDate.getTime());

        if (isValidDate) {
            setDateValue(inputDate)
        }
        else {
            setDateValue(new Date(lastValue.current));
        }
        
        onBlurCallback(
            baseProps, 
            inputDate instanceof Date && !isNaN(inputDate.getTime()) ? inputDate.getTime() : lastValue.current, 
            lastValue.current, 
            () => showTopBar(sendSetValues(
                    props.dataRow, 
                    props.name, 
                    props.columnName, 
                    inputDate.getTime(), 
                    context.server
                ), topbar)
        );
    }

    useEventHandler(calendarInput.current || undefined, "keydown", (event) => {
        event.stopPropagation();
        if ((event as KeyboardEvent).key === "Enter") {
            handleDateInput();
            alreadySaved.current = true;
            handleEnterKey(event, event.target, props.name, props.stopCellEditing);
            if (calendar.current) {
                setVisible(false)
            }
        }
        else if ((event as KeyboardEvent).key === "Tab") {
            handleDateInput();
            alreadySaved.current = true;
            if (isCellEditor && props.stopCellEditing) {
                props.stopCellEditing(event);
            }
            else if (calendar.current) {
                setVisible(false)
            }
        }
        else if ((event as KeyboardEvent).key === "Escape" && isCellEditor && props.stopCellEditing) {
            props.stopCellEditing(event);
        }
    });

    // useEffect(() => {
    //     setTimeout(() => {
    //         if(calendar.current && props.cellEditor.autoOpenPopup && ((props.cellEditor.preferredEditorMode === 1 || props.cellEditor.directCellEditor) && isCellEditor)) {
    //             //setVisible(true);
    //         }
    //     }, 33)
    // }, [calendar.current])

    return (
        <CustomCalendar
            ref={calendar}
            id={!isCellEditor ? props.name : undefined}
            inputRef={calendarInput}
            className="rc-editor-text rc-editor-date"
            monthNavigator={true}
            yearNavigator={true}
            yearRange="1900:2030"
            dateFormat={dateFormat}
            showTime={showTime}
            showSeconds={showSeconds}
            timeOnly={timeOnly}
            visible={visible}
            hourFormat={props.cellEditor.isAmPmEditor ? "12" : "24"}
            showIcon={true}
            style={layoutStyle}
            inputStyle={{...textAlignment, background: props.cellEditor_background_, borderRight: "none"}}
            value={dateValue ? new Date(dateValue) : undefined}
            appendTo={document.body}
            onChange={event => {
                setDateValue(event.value ? (event.value as Date).getTime() : null);
                if (calendarInput.current) {
                    calendarInput.current.focus();
                }
            }}
            onHide={() =>  !alreadySaved.current ? handleDateInput() : alreadySaved.current = false}
            disabled={!props.cellEditor_editable_}
            onVisibleChange={(e) => setVisible(e.type === 'dateselect' || !visible)}
        />
    )
}
export default UIEditorDate

class CustomCalendar extends Calendar {
    formatDateTime(date: Date) {
        let formattedValue = null;
        if (date) {
            if (this.props.timeOnly) {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat, { locale: getDateLocale() }) : formatISO(date);
            } else {
                formattedValue = this.props.dateFormat ? format(date, this.props.dateFormat, { locale: getDateLocale() }) : formatISO(date);
            }
        }

        return formattedValue;
    }
    parseDateTime(text: string) {
        let date = parseMultiple(text, [this.props.dateFormat || '', ...dateFormats], new Date(), { locale: getDateLocale() }) || new Date();

        if (this.props.timeOnly) {
            date = new Date();
            date.setHours(date.getHours());
            date.setMinutes(date.getMinutes());
            date.setSeconds(date.getSeconds());
        } else if (!this.props.showTime) {
            date = startOfDay(date);
        }

        return date;
    }
}