/** React imports */
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** Hook imports */
import { useTranslation } from '../zhooks';

/** 3rd Party imports */
import { Toast, ToastMessage } from 'primereact/toast';
import { Button } from 'primereact/button';

/** Other imports */
import { appContext } from '../../AppProvider';
import { ErrorResponse, MessageResponse } from '../../response';
import { concatClassnames } from '../util';

type IToast = {
    dialog:MessageResponse|ErrorResponse,
    severity:"error"|"info"|"warn"|"success"
}

/** This component displays a toast which either is a error toast or a message sent by the server */
const UIToast: FC = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Toast reference for error messages */
    const toastErrRef = useRef<Toast>(null);

    /** Toast reference for information messages */
    const toastInfoRef = useRef<Toast>(null);

    /** Index reference for removing toast */
    const toastIndex = useRef<number>(0);

    /** State of the toast properties (content, if it is an error or a message) */
    const [toastProps, setToastProps] = useState<IToast>();

    /** The translation */
    const translation = useTranslation();

    //TODO: Maybe in the future PrimeReact will release a "proper" way to close a single toast message.
    //Currently they only allow us to use the clear function which clears every toast message.
    const handleClose = useCallback((elem:HTMLElement) => {
        if (elem) {
            let id = -1;
            elem.classList.forEach(className => {
                if (className.includes("toast-")) {
                    id = parseInt(className.substring(6));
                }
            });
            if (id !== -1) {
                const newMessages = [...toastInfoRef.current?.state.messages].filter(message => message.id !== id);
                toastInfoRef.current?.setState({ messages: newMessages });
            }
        }
    },[]);

    /** Subscribes the toast components to messages */
    useEffect(() => {
        context.subscriptions.subscribeToMessage((dialog:MessageResponse|ErrorResponse, err:"error"|"info"|"warn"|"success") => setToastProps({dialog: dialog, severity: err}));
        return () => {
            context.subscriptions.unsubscribeFromMessage();
        }
    },[context.subscriptions]);

    /** Toast showing, styling and hiding handling */
    useEffect(() => {
        if (toastInfoRef.current && toastErrRef.current && toastIndex.current !== null && toastProps) {
            if (toastProps.severity) {
                const toast: ToastMessage = { severity: toastProps.severity, summary: toastProps.dialog.message }
                toastErrRef.current.show(toast);
                toastIndex.current++;
            }
            else {
                const messageObj: ToastMessage = { summary: toastProps.dialog.message, sticky: true, closable: false };

                messageObj.content =
                    <div className={concatClassnames("p-flex", "p-flex-column", "index-helper", "toast-" + toastIndex.current)}>
                        <div className={concatClassnames("toast-header", "info")}>
                            <div className="toast-header-left">
                                <i className="toast-header-icon pi pi-info-circle" />
                                <span className="toast-header-text">{translation.get("Information")}</span>
                            </div>
                            <button
                                className="toast-header-close pi pi-times"
                                onClick={event => {
                                    handleClose((event.target as HTMLElement).closest('.index-helper') as HTMLElement);
                                }} />
                        </div>
                        <div className="toast-content">
                            {(messageObj as ToastMessage).summary}
                        </div>
                        <div className={concatClassnames("toast-footer", "single-button")}>
                            <Button type="button" label="OK" onClick={(event) => {
                                handleClose((event.target as HTMLElement).closest('.index-helper') as HTMLElement);
                            }} />
                        </div>
                    </div>

                toastInfoRef.current.show(messageObj);
                toastIndex.current++;
            }
        }
    }, [toastProps])

    return (
        <>
            <Toast id="toastErr" ref={toastErrRef} position="top-right" />
            <Toast id="toast-info" ref={toastInfoRef} position="center" />
        </>
    )
}
export default UIToast