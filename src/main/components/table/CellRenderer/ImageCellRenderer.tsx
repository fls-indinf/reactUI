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

import React, { FC, useContext } from "react";
import { appContext } from "../../../contexts/AppProvider";
import { ICellEditorImage } from "../../editors/image/UIEditorImage";
import { ICellRender } from "../CellEditor";

const ImageCellRenderer: FC<ICellRender> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const castedCellEditor = props.columnMetaData.cellEditor as ICellEditorImage;

    return (
        <>
            <div className="cell-data-content">
               {props.icon ?? <img className="rc-table-image" src={props.cellData ? "data:image/jpeg;base64," + props.cellData : context.server.RESOURCE_URL + castedCellEditor.defaultImageName} alt="could not be loaded"/>}
            </div>
        </>
    )
}
export default ImageCellRenderer
