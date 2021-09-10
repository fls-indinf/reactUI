/** React imports */
import React, { FC, useContext, useEffect, useRef, useState } from "react"

/** 3rd Party imports */
import { Dialog } from 'primereact/dialog';
import { Helmet } from "react-helmet";

/** Other imports */
import TopBar from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { appContext } from "./moduleIndex";

type ServerFailMessage = {
    headerMessage:string,
    bodyMessage:string
}

type IAppWrapper = {
    appName?:string
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** State if timeout error should be shown */
    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    /** Reference for the dialog which shows the timeout error message */
    const dialogRef = useRef<ServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server." });

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToChangeDialog("server", (header:string, body:string) => {
            dialogRef.current.headerMessage = header;
            dialogRef.current.bodyMessage = body;
            setDialogVisible(true);
        });

        return () => {
            context.subscriptions.unsubscribeFromChangeDialog("server");
        }
    },[context.subscriptions]);

    return (
        <>
            <Helmet>
                <title>{props.appName ? props.appName : "VisionX Web"}</title>
            </Helmet>
            <UIToast />
            <Dialog header="Server Error!" visible={dialogVisible} onHide={() => setDialogVisible(false)} resizable={false}>
                <p>{dialogRef.current.bodyMessage.toString()}</p>
            </Dialog>
            <TopBar>
                {props.children}
            </TopBar>
        </>
    )
}
export default AppWrapper