//React
import React, {createContext, FC, useContext, useLayoutEffect, useEffect, useRef} from 'react';

//Custom
import REQUEST_ENDPOINTS from "./JVX/request/REQUEST_ENDPOINTS";
import {jvxContext} from "./JVX/jvxProvider";
import {createStartupRequest} from "./JVX/factories/RequestFactory";

//prime
import {Toast, ToastMessage} from 'primereact/toast';

//UI
import Home from "./frontmask/home/home";
import Login from "./frontmask/login/login";
import Settings from "./frontmask/settings/Settings"
import * as queryString from "querystring";
import {Route, Switch, useHistory} from "react-router-dom";
import { checkProperties } from './JVX/components/util/CheckProperties';
// import {serverMenuButtons} from "./JVX/response/MenuResponse";
import CustomHelloScreen from "./frontmask/customScreen/CustomHelloScreen";
import CustomChartScreen from "./frontmask/customScreen/CustomChartScreen";
import {ICustomContent} from "./MiddleMan"



type queryType = {
    appName?: string,
    userName?: string,
    password?: string,
    baseUrl?: string
}

export const toastContext = createContext<Function>(() => {})

const App: FC<ICustomContent> = (props) => {
    const context = useContext(jvxContext);
    const toastRef = useRef<Toast>(null);
    const history = useHistory()

    useEffect(() => {
        context.contentStore.registerCustomOfflineScreen("FirstOfflineScreen", "Custom Group", () => <CustomHelloScreen/>);
        context.contentStore.registerReplaceScreen("Cha-OL", () => <CustomChartScreen/>);
        //context.contentStore.registerCustomComponent("Fir-N7_B_DOOPEN", () => <CustomHelloScreen/>)
    }, [context.contentStore]);

    useEffect(() => {
        props.customScreens?.forEach(customScreen => {
            context.contentStore.registerCustomOfflineScreen(customScreen.screenName, customScreen.menuGroup, customScreen.screenFactory);
        });

        props.replaceScreens?.forEach(replaceScreen => {
            context.contentStore.registerReplaceScreen(replaceScreen.screenToReplace, replaceScreen.screenFactory);
        });

        props.customComponents?.forEach(replaceComponent => {
            context.contentStore.registerCustomComponent(replaceComponent.componentName, replaceComponent.compFactory);
        })
    },[context.contentStore, props.customScreens, props.replaceScreens, props.customComponents]);

    useLayoutEffect(() => {
        history.replace("/home")
        const queryParams: queryType = queryString.parse(window.location.search);
        const authKey = localStorage.getItem("authKey");
        fetch('config.json')
        .then((r) => r.json())
        .then((data) => {
            const emptyConfProps = checkProperties(data);
            if (emptyConfProps.length > 0) {
                let propsToPrint = ""
                emptyConfProps.forEach((emptyProp:string) => {
                    propsToPrint += emptyProp + ", "
                })
                const warnMsg = propsToPrint + "field(s) is/are not configured in the config.json file!"
                msg({severity: 'warn', summary: warnMsg})
                console.warn(warnMsg)
            }
            const startUpRequest = createStartupRequest();

            startUpRequest.applicationName = data.appName;
            context.server.APP_NAME = data.appName;
            context.server.BASE_URL = data.baseURL;
            context.server.RESOURCE_URL = data.baseURL + "/resource/" + data.appName;
            context.contentStore.LOGO = data.logo;
            startUpRequest.userName = data.username;
            startUpRequest.password = data.password;

            if(queryParams.appName && queryParams.baseUrl){
                startUpRequest.applicationName = queryParams.appName;
                context.server.APP_NAME = queryParams.appName;
                context.server.BASE_URL = queryParams.baseUrl;
                context.server.RESOURCE_URL = queryParams.baseUrl + "/resource/" + queryParams.appName
            }
            if(queryParams.userName && queryParams.password){
                startUpRequest.password = queryParams.password;
                startUpRequest.userName = queryParams.userName;
            }
            if(authKey){
                startUpRequest.authKey = authKey;
            }
            context.contentStore.notifyAppNameChanged(context.server.APP_NAME);
            startUpRequest.deviceMode = "desktop";
            startUpRequest.screenHeight = window.innerHeight;
            startUpRequest.screenWidth = window.innerWidth;
            context.server.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
            context.server.showToast = msg
        }).catch(() => {
            msg({severity: 'error', summary: 'config.json file could not be loaded. Make sure there is a config.json file in your public folder.', life: 5000});
        })
    }, [context.server, context.contentStore, history]);

    const msg = (messageObj: ToastMessage) => {
        if (toastRef.current) {
            toastRef.current.show(messageObj)
        }
    }

    return (
        <>
            <Toast ref={toastRef} position="top-right"/>
            <toastContext.Provider value={msg}>
                <Switch>
                    <Route exact path={"/login"} render={() => <Login />}/>
                    <Route exact path={"/home/:componentId"} render={props => <Home key={props.match.params.componentId} />} />
                    <Route exact path={"/settings"} render={() => <Settings />}/>
                    <Route path={"/home"} render={() => <Home key={'homeBlank'} />} />
                </Switch>   
            </toastContext.Provider>
        </>
  );
}
export default App;
