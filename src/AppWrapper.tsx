/** React imports */
import React, { FC, useContext, useEffect, useLayoutEffect, useState } from "react"

/** 3rd Party imports */
import { Helmet } from "react-helmet";

/** Other imports */
import TopBar from "./main/components/topbar/TopBar";
import UIToast from './main/components/toast/UIToast';
import { appContext, useConfirmDialogProps } from "./moduleIndex";
import { ConfirmDialog } from "primereact/confirmdialog";
import { PopupContextProvider } from "./main/components/zhooks/usePopupMenu";
import ErrorDialog from "./frontmask/errorDialog/ErrorDialog";

export type IServerFailMessage = {
    headerMessage:string,
    bodyMessage:string,
    sessionExpired:boolean,
    retry:Function
}

interface IAppWrapper {
    embedOptions?: { [key:string]:any }
    theme?:string
    colorScheme?:string
}

const AppWrapper:FC<IAppWrapper> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    const [dialogVisible, setDialogVisible] = useState<boolean>(false);

    const [messageVisible, messageProps] = useConfirmDialogProps();

    const [appName, setAppName] = useState<string>(context.appSettings.applicationMetaData.applicationName);

    /** Reference for the dialog which shows the timeout error message */
    const [errorProps, setErrorProps] = useState<IServerFailMessage>({ headerMessage: "Server Failure", bodyMessage: "Something went wrong with the server.", sessionExpired: false, retry: () => {} });

    useLayoutEffect(() => {
        const link:HTMLLinkElement = document.createElement('link'); 
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = 'application.css';
        document.getElementsByTagName('HEAD')[0].appendChild(link);

        const urlParams = new URLSearchParams(window.location.search);

        let options = new Map(props.embedOptions ? Object.entries(props.embedOptions) : urlParams);

        let themeToSet = "basti";
        let schemeToSet = "default";

        const getStyle = () => {
            if (options.has("colorScheme")) {
                if (props.colorScheme) {
                    return props.colorScheme;
                }
                return options.get("colorScheme");
            }
            return "default";
        }

        const getTheme = () => {
            if (options.has("theme")) {
                if (props.theme) {
                    return props.theme;
                }
                return options.get("theme");
            }
            return "basti";
        }

        if (process.env.NODE_ENV === "development") {
            fetch('config.json')
            .then((r) => r.json())
            .then(data => {
                if (data.theme) {
                    themeToSet = data.theme;

                    if (props.theme) {
                        themeToSet = props.theme
                    }
                }
                else {
                    themeToSet = getTheme();
                }

                if (data.colorScheme) {
                    schemeToSet = data.colorScheme;

                    if (props.colorScheme) {
                        schemeToSet = props.colorScheme
                    }
                }
                else {
                    schemeToSet = getStyle();
                }
            })
            .catch(() => {
                themeToSet = getTheme();
                schemeToSet = getStyle();
            })
            .then(() => {
                try {
                    require('./frontmask/themes/' + themeToSet + '.scss');
                }
                catch(err) {
                    require('./frontmask/themes/basti.scss');
                }

                try {
                    require('./frontmask/color-schemes/' + schemeToSet + '-scheme.scss');
                }
                catch(err) {
                    require('./frontmask/color-schemes/default-scheme.scss');
                }
                
                document.body.classList.add(schemeToSet);
            });
        }
        else {
            themeToSet = getTheme();
            schemeToSet = getStyle();
            try {
                require('./frontmask/themes/' + themeToSet + '.scss');
            }
            catch(err) {
                require('./frontmask/themes/basti.scss');
            }

            try {
                require('./frontmask/color-schemes/' + schemeToSet + '-scheme.scss');
            }
            catch(err) {
                require('./frontmask/color-schemes/default-scheme.scss');
            }
            document.body.classList.add(schemeToSet);
        }
    }, []);

    

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToDialog("server", (header:string, body:string, sessionExp:boolean, retry:Function) => setErrorProps({ headerMessage: header, bodyMessage: body, sessionExpired: sessionExp, retry: retry }));

        context.subscriptions.subscribeToErrorDialog((show:boolean) => setDialogVisible(show));

        context.subscriptions.subscribeToAppName((newAppName:string) => setAppName(newAppName));

        return () => {
            context.subscriptions.unsubscribeFromDialog("server");
            context.subscriptions.unsubscribeFromErrorDialog((show:boolean) => setDialogVisible(show));
            context.subscriptions.unsubscribeFromAppName((newAppName:string) => setAppName(newAppName));
        }
    },[context.subscriptions]);

    return (
        <>
            <Helmet>
                <title>{appName ? appName : "<App-Name>"}</title>
            </Helmet>
            <UIToast />
            <ConfirmDialog visible={messageVisible} {...messageProps} />
            {dialogVisible && <ErrorDialog headerMessage={errorProps.headerMessage} bodyMessage={errorProps.bodyMessage} sessionExpired={errorProps.sessionExpired} retry={errorProps.retry} />}
            <PopupContextProvider>
                <TopBar>
                    {props.children}
                </TopBar>
            </PopupContextProvider>
        </>
    )
}
export default AppWrapper