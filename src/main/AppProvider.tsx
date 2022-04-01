import React, { createContext, FC, useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";
import API from "./API";
import AppSettings, { appVersion } from "./AppSettings";
import { createChangesRequest, createOpenScreenRequest, createStartupRequest, createUIRefreshRequest, getClientId, useEventHandler } from "../moduleIndex";
import { addCSSDynamically, Timer } from "./util";
import { ICustomContent } from "../MiddleMan";
import { REQUEST_KEYWORDS, StartupRequest, UIRefreshRequest } from "./request";
import { BaseResponse, RESPONSE_NAMES } from "./response";
import { showTopBar, TopBarContext } from "./components/topbar/TopBar";

/** Type for AppContext */
export type AppContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    api: API,
    appSettings: AppSettings,
    ctrlPressed: boolean,
    appReady: boolean
}

/** Contentstore instance */
const contentStore = new ContentStore();
/** SubscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore)
/** AppSettings instance */
const appSettings = new AppSettings(contentStore, subscriptions);
/** Server instance */
const server = new Server(contentStore, subscriptions, appSettings);
/** API instance */
const api = new API(server, contentStore, appSettings, subscriptions);


contentStore.setSubscriptionManager(subscriptions);
server.setAPI(api);
/** Initial value for state */
const initValue: AppContextType = {
    contentStore: contentStore,
    server: server,
    api: api,
    appSettings: appSettings,
    subscriptions: subscriptions,
    ctrlPressed: false,
    appReady: false
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/**
 * This component provides the appContext to its children
 * @param children - the children
 */
const AppProvider: FC<ICustomContent> = (props) => {
    /** History of react-router-dom */
    const history = useHistory();

    /** Sets the initial state */
    const initState = (): AppContextType => {
        initValue.contentStore.history = history;
        initValue.api.history = history;
        initValue.server.history = history;
        return {
            ...initValue,
        }
    }

    const ws = useRef<WebSocket|null>(null);

    const relaunchArguments = useRef<any>(null);

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState());

    /** Flag to retrigger Startup if session expires */
    const [restart, setRestart] = useState<boolean>(false);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /**
     * Subscribes to session-expired notification and app-ready
     * @returns unsubscribes from session and app-ready
     */
     useEffect(() => {
        contextState.subscriptions.subscribeToAppReady((ready:boolean) => setContextState(prevState => ({ ...prevState, appReady: true })));
        contextState.subscriptions.subscribeToRestart(() => setRestart(prevState => !prevState));

        return () => {
            contextState.subscriptions.unsubscribeFromAppReady();
            contextState.subscriptions.unsubscribeFromRestart(() => setRestart(prevState => !prevState));
        }
    },[contextState.subscriptions]);

    /** Default values for translation */
    useEffect(() => {
        contextState.contentStore.translation
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
    },[contextState.contentStore]);

    useEffect(() => {
        const startUpRequest = createStartupRequest();
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = localStorage.getItem("authKey");
        const newServer = new Server(contextState.contentStore, contextState.subscriptions, contextState.appSettings, history);
        let themeToSet = "";
        let schemeToSet = "";
        let designToSet = "";

        const initWS = (baseURL:string) => {
            const urlSubstr = baseURL.substring(newServer.BASE_URL.indexOf("//") + 2, baseURL.indexOf("/services/mobile"));
            
            ws.current = new WebSocket((baseURL.substring(0, baseURL.indexOf("//")).includes("https") ? "wss://" : "ws://") + urlSubstr + "/pushlistener?clientId=" + getClientId());
            ws.current.onopen = () => console.log("ws opened");
            ws.current.onclose = () => console.log("ws closed");
            ws.current.onerror = () => console.error("ws error");
            ws.current.onmessage = (e) => {
                if (e.data instanceof Blob) {
                    const reader = new FileReader()

                    reader.onloadend = () => { 
                        let jscmd = JSON.parse(String(reader.result)); 
            
                        if (jscmd.command === "relaunch") {
                            contextState.contentStore.reset();
                            relaunchArguments.current = jscmd.arguments;
                            setRestart(prevState => !prevState);
                        }
                        else if (jscmd.command === "api/reopenScreen") {
                            const openReq = createOpenScreenRequest();
                            openReq.className = jscmd.arguments.className;
                            contextState.server.lastOpenedScreen = jscmd.arguments.className;
                            showTopBar(contextState.server.sendRequest(openReq, REQUEST_KEYWORDS.REOPEN_SCREEN), topbar);
                        }
                        else if (jscmd.command === "reloadCss") {
                            contextState.subscriptions.emitCssVersion(jscmd.arguments.version);
                        }
                    }
                    reader.readAsText(e.data);
                }
                else {
                    if (e.data === "api/changes") {
                        contextState.server.sendRequest(createChangesRequest(), REQUEST_KEYWORDS.CHANGES);
                    }
                }
            }

            if (contextState.appSettings.applicationMetaData.aliveInterval) {
                contextState.contentStore.setWsAndTimer(ws.current, new Timer(() => ws.current?.send("ALIVE"), contextState.appSettings.applicationMetaData.aliveInterval));
            }
            
            // setInterval(() => {
            //     if (!maxTriesExceeded.current) {
            //         if (retryCounter.current < maxRetries) {
            //             ws.current?.send("ALIVE");
            //             if (aliveSent.current) {
            //                 retryCounter.current++;
            //                 context.subscriptions.emitDialog(
            //                     "server", 
            //                     false, 
            //                     "Alive Check failed.", 
            //                     "The server did not respond to the alive check. The client is retrying to reach the server. Retry: " + retryCounter.current + " out of " + maxRetries)
            //                 if (retryCounter.current === 1) {
            //                     context.subscriptions.emitErrorDialogVisible(true);
            //                     errorDialogVisible.current = true;
            //                 }
            //             }
            //             else {
            //                 aliveSent.current = true;
            //                 retryCounter.current = 0;
            //             }
            //         }
            //         else {
            //             context.subscriptions.emitDialog("server", false, "Alive Check exceeded Max-Retries!", "The server did not respond after " + maxRetries + " tries to send the alive-check.");
            //             context.subscriptions.emitErrorDialogVisible(true);
            //             maxTriesExceeded.current = true;
            //         }
            //     }
            // }, 5000);
            

            // ws2.current = new WebSocket("ws://localhost:666");
            // ws2.current.onopen = () => {
            //     console.log('ws2 opened')
            //     ws2.current!.send("test")
            // };
        }

        const sendStartup = (req:StartupRequest|UIRefreshRequest, preserve:boolean, startupRequestHash:string, restartArgs?:any) => {
            if (restartArgs) {
                (req as StartupRequest).arguments = restartArgs;
                relaunchArguments.current = null;
            }
            newServer.sendRequest(req, (preserve && startupRequestHash && !restartArgs) ? REQUEST_KEYWORDS.UI_REFRESH : REQUEST_KEYWORDS.STARTUP)
            .then(result => {
                if (!preserve) {
                    sessionStorage.setItem(startupRequestHash, JSON.stringify(result));
                }
                afterStartup(result)
            });
        }

        const afterStartup = (results:BaseResponse[]) => {
            if (!(results.length === 1 && results[0].name === RESPONSE_NAMES.SESSION_EXPIRED)) {
                contextState.subscriptions.emitErrorDialogVisible(false);
            }

            initWS(newServer.BASE_URL);
        }

        const fetchAppConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/config/app.json').then((r) => r.json())
                .then((data) => {
                    if (data.timeout) {
                        newServer.timeoutMs = parseInt(data.timeout)
                    }
                    resolve({});
                })
                .catch(() => reject("app.json not found"))
            });
        }

        const fetchVersionConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('assets/version/app_version.json').then((r) => r.json())
                .then((data) => {
                    if (data.version) {
                        contextState.appSettings.version = parseInt(data.version);
                        newServer.endpointMap = newServer.setEndPointMap(parseInt(data.version));
                        appVersion.version = parseInt(data.version)
                    }
                    resolve({});
                })
                .catch(() => reject("app_version.json not found"));
            });
        }

        const fetchConfig = () => {
            return new Promise<any>((resolve, reject) => {
                fetch('config.json')
                .then((r) => r.json())
                .then((data) => {
                    const dataMap = new Map(Object.entries(data));
                    dataMap.forEach((v, k) => {
                        if (k === "appName") {
                            startUpRequest.applicationName = v;
                        }
                        else if (["theme", "colorScheme"].indexOf(k) === -1) {
                            startUpRequest[k] = v;
                        }
                    });
                    newServer.BASE_URL = data.baseUrl;
        
                    if (data.logoBig) {
                        contextState.appSettings.LOGO_BIG = data.logoBig;
                    }
        
                    if (data.logoSmall) {
                        contextState.appSettings.LOGO_SMALL = data.logoSmall;
                    } 
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_SMALL = data.logoBig;
                    }
                        
                    if (data.logoLogin) {
                        contextState.appSettings.LOGO_LOGIN = data.logoLogin;
                    }
                    else if (data.logoBig) {
                        contextState.appSettings.LOGO_LOGIN = data.logoBig;
                    }
    
                    if (data.langCode) {
                        contextState.appSettings.language = data.langCode;
                    }
    
                    if (data.timezone) {
                        contextState.appSettings.timezone = data.timezone;
                    }
    
                    if (data.colorScheme) {
                        schemeToSet = data.colorScheme;
                    }
    
                    if (data.theme) {
                        themeToSet = data.theme;
                    }
    
                    if (data.design) {
                        designToSet = data.design;
                    }
                    resolve({})
                })
                .catch(() => reject("config.json not found"))
            });
        }
        //checks either url or embed options
        const checkExtraOptions = (options: URLSearchParams|{ [key:string]:any }) => {
            let convertedOptions:Map<string, any>;
            let appName;
            let baseUrl;

            if (options instanceof URLSearchParams) {
                convertedOptions = new Map(options);
            }
            else {
                newServer.embedOptions = options;
                convertedOptions = new Map(Object.entries(options));
            }

            if (convertedOptions.has("appName")) {
                appName = convertedOptions.get("appName") as string;
                if (appName.charAt(appName.length - 1) === "/") {
                    appName = appName.substring(0, appName.length - 1);
                }
                startUpRequest.applicationName = appName;
                convertedOptions.delete("appName");
            }

            if (convertedOptions.has("baseUrl")) {
                baseUrl = convertedOptions.get("baseUrl") as string;
                if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                }
                newServer.BASE_URL = baseUrl;
                convertedOptions.delete("baseUrl");
            }
            else if (process.env.NODE_ENV === "production") {
                const splitURLPath = window.location.pathname.split("/");

                if (splitURLPath.length - 2 >= 3 || !splitURLPath[1]) {
                    newServer.BASE_URL = window.location.protocol + "//" + window.location.host + "/services/mobile"
                }
                else if (splitURLPath[1]) {
                    newServer.BASE_URL = window.location.protocol + "//" + window.location.host + "/" + splitURLPath[1] + "/services/mobile";
                }
            }

            if (convertedOptions.has("layout") && ["standard", "corporation", "modern"].indexOf(convertedOptions.get("layout") as string) !== -1) {
                contextState.appSettings.setApplicationLayoutByURL(convertedOptions.get("layout") as "standard" | "corporation" | "modern");
            }

            if (convertedOptions.has("langCode")) {
                contextState.appSettings.language = convertedOptions.get("langCode");
            }

            if (convertedOptions.has("timezone")) {
                contextState.appSettings.timezone = convertedOptions.get("timezone");
            }

            if (convertedOptions.has("deviceMode")) {
                contextState.appSettings.deviceMode = convertedOptions.get("deviceMode");
            }

            if (convertedOptions.has("colorScheme")) {
                schemeToSet = convertedOptions.get("colorScheme");
                convertedOptions.delete("colorScheme");
            }

            if (props.colorScheme) {
                schemeToSet = props.colorScheme;
            }

            if (schemeToSet) {
                contextState.appSettings.setApplicationColorSchemeByURL(schemeToSet);
                addCSSDynamically('color-schemes/' + schemeToSet + '-scheme.css', "schemeCSS", contextState.appSettings);
            }

            if (convertedOptions.has("theme")) {
                themeToSet = convertedOptions.get("theme");
                convertedOptions.delete("theme");
            }

            if (props.theme) {
                themeToSet = props.theme;
            }

            if (themeToSet) {
                contextState.appSettings.setApplicationThemeByURL(themeToSet);
                addCSSDynamically('themes/' + themeToSet + '.css', "themeCSS", contextState.appSettings);
                contextState.subscriptions.emitThemeChanged(themeToSet);
            }

            if (convertedOptions.has("design")) {
                designToSet = convertedOptions.get("design");
                convertedOptions.delete("design");
            }

            if (props.design) {
                designToSet = props.design;
            }

            if (designToSet) {
                contextState.appSettings.setApplicationDesign(designToSet);
                addCSSDynamically('design/' + designToSet + ".css", "designCSS", contextState.appSettings);
            }

            if (convertedOptions.has("version")) {
                contextState.appSettings.version = parseInt(convertedOptions.get("version"));
                newServer.endpointMap = newServer.setEndPointMap(parseInt(convertedOptions.get("version")));
                appVersion.version = parseInt(convertedOptions.get("version"));
            }

            convertedOptions.forEach((v, k) => {
                startUpRequest[k] = v;
            });
        }

        const afterConfigFetch = () => {
            checkExtraOptions(props.embedOptions ? props.embedOptions : urlParams);

            if (props.onMenu) {
                contextState.server.setOnMenuFunction(props.onMenu);
            }
    
            if (props.onOpenScreen) {
                contextState.server.setOnOpenScreenFunction(props.onOpenScreen);
            }
    
            if (props.onLogin) {
                contextState.server.setOnLoginFunction(props.onLogin);
            }

            startUpRequest.requestUri = window.location.href.substring(0, window.location.href.indexOf('#/') + 2);

            if(authKey) {
                startUpRequest.authKey = authKey;
            }
            startUpRequest.deviceMode = contextState.appSettings.deviceMode;
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            if (contextState.contentStore.customStartUpProperties.length) {
                contextState.contentStore.customStartUpProperties.map(customProp => startUpRequest["custom_" + Object.keys(customProp)[0]] = Object.values(customProp)[0])
            }

            const startupRequestHash = [
                'startup', 
                startUpRequest.appMode,
                startUpRequest.applicationName,
                startUpRequest.userName,
                startUpRequest.technology,
                startUpRequest.deviceMode,
            ].join('::');
            const startupRequestCache = sessionStorage.getItem(startupRequestHash);
            if (startupRequestCache && !relaunchArguments.current) {
                let preserveOnReload = false;
                (JSON.parse(startupRequestCache) as Array<any>).forEach((response) => {
                    if (response.preserveOnReload) {
                        preserveOnReload = true;
                    }
                });
                if (preserveOnReload) {
                    for (let [, value] of newServer.subManager.jobQueue.entries()) {
                        value();
                    }
                    newServer.subManager.jobQueue.clear();
                }
                contextState.server = newServer;
                sendStartup(preserveOnReload ? createUIRefreshRequest() : startUpRequest, preserveOnReload, startupRequestHash);
            } 
            else {
                contextState.server = newServer;
                sendStartup(startUpRequest, false, startupRequestHash, relaunchArguments.current);
            }
        }

        if (process.env.NODE_ENV === "development") {
            Promise.all([fetchConfig(), fetchAppConfig(), fetchVersionConfig()])
            .then(() => afterConfigFetch())
            .catch(() => afterConfigFetch())
        }
        else {
            Promise.all([fetchAppConfig(), fetchVersionConfig()])
            .then(() => afterConfigFetch())
            .catch(() => afterConfigFetch())
        }
    }, [restart])

    useEventHandler(document.body, "keydown", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = true : undefined);

    useEventHandler(document.body, "keyup", (event) => (event as any).key === "Control" ? contextState.ctrlPressed = false : undefined);

    return (
        <appContext.Provider value={contextState}>
            {props.children}
        </appContext.Provider>
    )
}
export default AppProvider


