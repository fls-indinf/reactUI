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

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { ListBox } from "primereact/listbox"
import React, { CSSProperties, FC, useCallback, useEffect, useMemo, useState } from "react";
import tinycolor from "tinycolor2";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import ErrorResponse from "../../main/response/error/ErrorResponse";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";

/** Displays an errr-message as dialog */
const ErrorDialog:FC = () => {
    /** Returns utility variables */
    const [context,, translations] = useConstants();

    /** True, if the error-dialog is visible */
    const [visible, setVisible] = useState<boolean>(false);

    /** State of the error-properties */
    const [errorProps, setErrorProps] = useState<ErrorResponse>();

    /** True, if the error-details should be displayed */
    const [showDetails, setShowDetails] = useState<boolean>(false);

    /** The button background based on the color-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /** The currently selected error when details is expanded */
    const [selectedError, setSelectedError] = useState<{label: string, exception: string} | null>(null)

    const errorItems = useMemo(() => {
        if (errorProps && errorProps.exceptions) {
            return [{
                label: translations.get("Cause(s) of failure") as string,
                items: errorProps.exceptions.map(ex => {
                    return { label: ex.message, exception: ex.exception }
                })
            }]
        }
        return [{
            label: translations.get("Cause(s) of failure") as string,
            items: []
        }]
    }, [errorProps]);

    useEffect(() => {
        context.subscriptions.subscribeToErrorDialogProps((errData:ErrorResponse) => setErrorProps(errData));

        return () => context.subscriptions.unsubscribeFromErrorDialogProps();
    }, [context.subscriptions]);

    useEffect(() => {
        if (errorProps) {
            setVisible(true);
        }
    }, [errorProps]);

    useEffect(() => {
        const elem = document.getElementById("error-dialog");
        if (!showDetails && elem) {
            elem.style.removeProperty("width");
            elem.style.removeProperty("height");
        }
    }, [showDetails]);

    const handleOnHide = () => setVisible(false)    

    const errorFooter = useCallback(() => {
        return (
            <div className="error-dialog-footer">
                <div className="error-dialog-footer-buttons">
                    {errorProps?.exceptions && errorProps.exceptions.length && <Button
                        type="button"
                        className="rc-button error-dialog-footer-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Details")}
                        onClick={() => {
                            setSelectedError(errorItems.length ? errorItems[0].items[0] : null);
                            setShowDetails(prevState => !prevState)
                        }} />}
                    <Button
                        type="button"
                        className="rc-button error-dialog-footer-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("OK")}
                        onClick={() => handleOnHide()} />
                </div>
                {showDetails &&
                    <div className="error-dialog-footer-details">
                        <div
                            className="rc-panel-group-caption error-dialog-details-caption"
                            style={{ marginTop: "1rem", textAlign: "left" }}>
                            <span>Details</span>
                        </div>
                        <ListBox
                            className="error-dialog-listbox"
                            value={selectedError}
                            optionGroupLabel="label"
                            optionGroupChildren="items"
                            optionLabel="label"
                            options={errorItems}
                            onChange={(e) => {
                                if (e.value !== null) {
                                    setSelectedError(e.value)
                                }
                            }} />
                        <InputTextarea
                            className={concatClassnames("rc-input", "error-dialog-textarea")}
                            value={selectedError?.exception}
                            style={{ resize: 'none' }}
                            readOnly />
                    </div>
                }
            </div>
        )
    }, [showDetails, selectedError, errorProps])

    return (
        <Dialog
            id="error-dialog"
            className={concatClassnames("error-dialog", showDetails ? "error-details-enabled" : "") }
            header={translations.get(errorProps?.title as string) || translations.get("Error")} 
            footer={errorFooter} 
            visible={visible} 
            onHide={handleOnHide} 
            baseZIndex={1005}
            resizable >
            <i className="error-dialog-icon pi pi-times-circle" />
            <span style={{paddingTop: "4px"}}>{errorProps?.message}</span>
        </Dialog>
    )
}
export default ErrorDialog;