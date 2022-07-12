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

import React, { FC, useContext, useMemo } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { NumericColumnDescription } from "../../../response/data/MetaDataResponse";
import { getGrouping, getMinimumIntDigits, getScaleDigits } from "../../../util/component-util/NumberProperties";
import { ICellEditorNumber } from "../../editors/number/UIEditorNumber";
import { ICellRender } from "../CellEditor";

/**
 * Renders the number-cell when the column is a number-cell
 * @param props - the properties received from the table
 */
const NumberCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    // Casts the metadata to NumericColumnDescription
    const castedMetaData = props.columnMetaData as NumericColumnDescription

    /** Casts the cell-editor property to ICellEditorDate because we can be sure it is a date-cell-editor */
    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorNumber;

    // Formats the number value to the correct format
    const displayNumberValue = useMemo(() => {
        if (props.cellData !== null) {
            return Intl.NumberFormat(context.appSettings.locale,
                {
                    useGrouping: getGrouping(castedCellEditor.numberFormat),
                    minimumIntegerDigits: getMinimumIntDigits(castedCellEditor.numberFormat),
                    minimumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).minScale,
                    maximumFractionDigits: getScaleDigits(castedCellEditor.numberFormat, castedMetaData.scale).maxScale
                }).format(props.cellData);
        }
        return props.cellData
    }, [props.cellData, castedMetaData, castedCellEditor]);

    return (
        <>
            <div className="cell-data-content">
                {props.icon ?? displayNumberValue}
            </div>
        </>
    )
}
export default NumberCellRenderer
