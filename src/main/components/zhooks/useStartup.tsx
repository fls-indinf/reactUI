/** React imports */
import { useContext, useEffect, useRef, useState } from "react";

/** 3rd Party imports */
import { useHistory } from "react-router";

/** Other imports */
import { appContext } from "../../AppProvider";
import { createChangesRequest, createStartupRequest, createUIRefreshRequest, getClientId } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS, StartupRequest, UIRefreshRequest } from "../../request";
import { ICustomContent } from "../../../MiddleMan";
import { useEventHandler } from ".";
import { BaseResponse, RESPONSE_NAMES } from "../../response";

const useStartup = (props:ICustomContent):boolean => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** History of react-router-dom */
    const history = useHistory();

    /** True, if the app is ready */
    const [appReady, setAppReady] = useState<boolean>(false);

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    const ws = useRef<WebSocket|null>(null);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        context.subscriptions.subscribeToAppReady((ready:boolean) => setAppReady(ready));
        context.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));

        return () => {
            context.subscriptions.unsubscribeFromAppReady();
            context.subscriptions.unsubscribeFromRestart();
        }
    },[context.subscriptions]);

    /** Default values for translation */
    useEffect(() => {
        context.contentStore.translation
        .set("Username", "Username")
        .set("Password", "Password")
        .set("Login", "Login")
        .set("Logout", "Logout")
        .set("Settings", "Settings")
        .set("Change password", "Change password")
        .set("Please enter and confirm the new password.", "Please enter and confirm the new password.")
        .set("New Password", "New Password")
        .set("Confirm Password", "Confirm Password")
        .set("The new Password is empty", "The new Password is empty")
        .set("The passwords are different!", "The passwords are different!")
        .set("The old and new password are the same", "The old and new password are the same")
        .set("Change password", "Change password")
        .set("Reset password", "Reset password")
        .set("Lost password", "Lost password")
        .set("Remember me?", "Remember me?")
        .set("Email", "Email")
        .set("Request", "Request")
        .set("Please enter your e-mail address.", "Please enter your e-mail address.")
        .set("The email is required", "The email is required")
        .set("One-time password", "One-time password")
        .set("Please enter your one-time password and set a new password", "Please enter your one-time password and set a new password")
        .set("Please enter your e-mail address.", "Please enter your e-mail address.")
        .set("Save", "Save")
        .set("Reload", "Reload")
        .set("Rollback", "Rollback")
        .set("Information", "Information")
        .set("Error", "Error")
        .set("Warning", "Warning")
        .set("Question", "Question")
        .set("OK", "OK")
        .set("Cancel", "Cancel")
        .set("Yes", "Yes")
        .set("No", "No")
        .set("Change", "Change")
        .set("Session expired!", "Session expired!")
        .set("Take note of any unsaved data, and <u>click here</u> or press ESC to continue.", "Take note of any unsaved data, and <u>click here</u> or press ESC to continue.");
    },[context.contentStore]);

    /**
     * On reload navigate to home, fetch config.json if some fields are not configured, warns user with toast.
     * Sets StartupRequest-, Server- and Contentstore properties based on config file or URLSearchParams
     * Sets Appname for header, and sends StartupRequest.
     */
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = localStorage.getItem("authKey");

        if (props.onStartup) {
            props.onStartup();
        }

        const initWS = (baseURL:string) => {
            const urlSubstr = baseURL.substring(context.server.BASE_URL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));
            ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId());
            ws.current.onopen = () => console.log("ws opened");
            ws.current.onclose = () => console.log("ws closed");
            ws.current.onmessage = (e) => {
                if (e.data === "api/changes") {
                    context.server.sendRequest(createChangesRequest(), REQUEST_ENDPOINTS.CHANGES);
                }
            }
        }

        const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, startupRequestHash:string) => {
            context.server.sendRequest(req, (preserve && startupRequestHash) ? REQUEST_ENDPOINTS.UI_REFRESH : REQUEST_ENDPOINTS.STARTUP)
            .then(result => {
                if (!preserve) {
                    sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
                }
                afterStartup(result)
            });
        }

        const afterStartup = (results:BaseResponse[]) => {
            if (!(results.length === 1 && results[0].name === RESPONSE_NAMES.SESSION_EXPIRED)) {
                context.subscriptions.emitErrorDialogVisible(false);
            }

            initWS(context.server.BASE_URL);
        }

        const setStartupProperties = (startupReq:StartupRequest, options?:URLSearchParams|{ [key:string]:any }) => {
            if (options) {
                let convertedOptions:Map<string, any>;
                let appName;
                let baseUrl;

                if (options instanceof URLSearchParams) {
                    convertedOptions = new Map(options);
                }
                else {
                    context.server.embedOptions = options;
                    convertedOptions = new Map(Object.entries(options));
                }

                if (convertedOptions.has("appName")) {
                    appName = convertedOptions.get("appName") as string;
                    if (appName.charAt(appName.length - 1) === "/") {
                        appName = appName.substring(0, appName.length - 1);
                    }
                    startupReq.applicationName = appName;
                    convertedOptions.delete("appName");
                }

                if (convertedOptions.has("baseUrl")) {
                    baseUrl = convertedOptions.get("baseUrl") as string;
                    if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                    }
                    context.server.BASE_URL = baseUrl;
                    convertedOptions.delete("baseUrl");
                }
                else if (process.env.NODE_ENV === "production") {
                    const splitURLPath = window.location.pathname.split("/");
                    if (splitURLPath[1]) {
                        context.server.BASE_URL = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
                    }
                    else {
                        context.server.BASE_URL = window.location.protocol + "//" + window.location.host + "/services/mobile"
                    }
                }

                if (convertedOptions.has("layout") && ["standard", "corporation", "modern"].indexOf(convertedOptions.get("layout") as string) !== -1) {
                    context.appSettings.setApplicationLayoutByURL(convertedOptions.get("layout") as "standard" | "corporation" | "modern");
                }

                convertedOptions.forEach((v, k) => {
                    startUpRequest[k] = v;
                });

                if(authKey) {
                    startupReq.authKey = authKey;
                }
                startupReq.deviceMode = "desktop";
                startupReq.screenHeight = window.innerHeight;
                startupReq.screenWidth = window.innerWidth;
                if (context.contentStore.customStartUpProperties.length) {
                    context.contentStore.customStartUpProperties.map(customProp => startupReq["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
                }
    
                const startupRequestHash = [
                    'startup', 
                    startupReq.appMode,
                    startupReq.applicationName,
                    startupReq.userName,
                    startupReq.technology,
                    startupReq.deviceMode,
                ].join('::');
                const startupRequestCache = sessionStorage.getItem(startupRequestHash);
                if (startupRequestCache) {
                    let preserveOnReload = false;
                    (JSON.parse(startupRequestCache) as Array<any>).forEach((response) => {
                        if (response.preserveOnReload) {
                            preserveOnReload = true;
                        }
                    });
                    if (preserveOnReload) {
                        for (let [, value] of context.server.subManager.jobQueue.entries()) {
                            value();
                        }
                        context.server.subManager.jobQueue.clear();
                    }
                    sendStartup(preserveOnReload ? createUIRefreshRequest() : startupReq, preserveOnReload, startupRequestHash);
                } 
                else {
                    sendStartup(startupReq, false, startupRequestHash);
                }
            }
        }

        const startUpRequest = createStartupRequest();
        if (process.env.NODE_ENV === "development") {
            fetch('config.json')
            .then((r) => r.json())
            .then((data) => {
                const dataMap = new Map(Object.entries(data));
                dataMap.forEach((v, k) => {
                    if (k === "appName") {
                        startUpRequest.applicationName = v;
                    }
                    else {
                        startUpRequest[k] = v;
                    }
                });
                context.server.BASE_URL = data.baseUrl;
    
                if (data.logoBig) {
                    context.appSettings.LOGO_BIG = data.logoBig;
                }
    
                if (data.logoSmall) {
                    context.appSettings.LOGO_SMALL = data.logoSmall;
                } 
                else if (data.logoBig) {
                    context.appSettings.LOGO_SMALL = data.logoBig;
                }
                    
                if (data.logoLogin) {
                    context.appSettings.LOGO_LOGIN = data.logoLogin;
                }
                else if (data.logoBig) {
                    context.appSettings.LOGO_LOGIN = data.logoBig;
                }

                setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams);
            }).catch(() => {
                setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams);
            });
        }
        else {
            setStartupProperties(startUpRequest, props.embedOptions ? props.embedOptions : urlParams);
        }

        return () => {
            ws.current?.close();
        }
    }, [context.server, context.contentStore, context.subscriptions, history, restart]);

    /** Sets custom- or replace screens/components when reactUI is used as library based on props */
    useEffect(() => {
        if (props.onMenu) {
            context.server.setOnMenuFunction(props.onMenu);
        }

        if (props.onOpenScreen) {
            context.server.setOnOpenScreenFunction(props.onOpenScreen);
        }

        if (props.onLogin) {
            context.server.setOnLoginFunction(props.onLogin);
        }
    }, [context.contentStore]);

    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? context.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? context.ctrlPressed = false : undefined);

    return appReady
}
export default useStartup