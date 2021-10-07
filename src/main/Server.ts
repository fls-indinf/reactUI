/** 3rd Party imports */
import {parseString} from "xml2js"
import * as _ from 'underscore'

/** Other imports */
import ContentStore from "./ContentStore"
import { ApplicationMetaDataResponse,
         BaseResponse,
         MenuResponse,
         GenericResponse,
         CloseScreenResponse,
         RESPONSE_NAMES,
         AuthenticationDataResponse,
         UserDataResponse,
         FetchResponse,
         MetaDataResponse,
         DataProviderChangedResponse,
         ShowDocumentResponse,
         UploadResponse,
         DownloadResponse,
         SessionExpiredResponse,
         ErrorResponse,
         RestartResponse,
         ApplicationParametersResponse,
         LanguageResponse, 
         MessageResponse,
         LoginResponse,
         ApplicationSettingsResponse,
         DeviceStatusResponse,
         WelcomeDataResponse,
         DialogResponse,
         CloseFrameResponse} from "./response";
import { createFetchRequest, createStartupRequest } from "./factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "./request";
import { IPanel } from "./components/panels"
import { SubscriptionManager } from "./SubscriptionManager";
import { History } from "history";
import TreePath from "./model/TreePath";
import AppSettings from "./AppSettings";
import API from "./API";

/** Server class sends requests and handles responses */
class Server {

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     * @param subManager - subscription-manager instance
     * @param history - the history
     * @param openRequests - the current open requests
     */
    constructor(store: ContentStore, subManager:SubscriptionManager, appSettings:AppSettings, history?: History<any>) {
        this.contentStore = store;
        this.subManager = subManager;
        this.appSettings = appSettings;
        this.history = history;
        this.openRequests = new Map<any, Promise<any>>();
        this.api = new API(this, store, appSettings, subManager, history);
    }

    /** Application name */
    APP_NAME = "";

    /** Base url for requests */
    BASE_URL = "";

    /** Resource url for receiving images etc. */
    RESOURCE_URL = "";

    /** Contentstore instance */
    contentStore: ContentStore;
    /** SubscriptionManager instance */
    subManager:SubscriptionManager;
    /** AppSettings instance */
    appSettings:AppSettings;
    /** the react routers history object */
    history?:History<any>;
    /** a map of still open requests */
    openRequests: Map<any, Promise<any>>;
    /** embedded options, null if not defined */
    embeddedOptions:{ [key:string]:any }|null = null;

    api:API;

    onMenuFunction:Function = () => {};

    onOpenScreenFunction:Function = () => {};

    onLoginFunction:Function = () => {};

    lastClosedWasPopUp = false;

    setAPI(api:API) {
        this.api = api;
    }

    setOnMenuFunction(fn:Function) {
        this.onMenuFunction = fn;
    }

    setOnOpenScreenFunction(fn:Function) {
        this.onOpenScreenFunction = fn;
    }

    setOnLoginFunction(fn:Function) {
        this.onLoginFunction = fn;
    }

    /** ----------APP-FUNCTIONS---------- */

    /**
     * Builds a request to send to the server
     * @param request - the request to send
     * @returns - a request to send to the server
     */
    buildReqOpts(request:any) {
        let reqOpt: RequestInit = {
            method: 'POST',
            body: JSON.stringify(request),
            credentials:"include",
        };
        return reqOpt;
    }

    /** ----------SENDING-REQUESTS---------- */
 
    /**
     * Sends a request to the server and handles its response, if there are jobs in the
     * SubscriptionManagers JobQueue, call them after the response handling is complete
     * @param request - the request to send
     * @param endpoint - the endpoint to send the request to
     */
    sendRequest(request: any, endpoint: string, fn?:Function[], job?:boolean, waitForOpenRequests?:boolean){
        let promise = new Promise<any>((resolve) => {
            this.timeoutRequest(fetch(this.BASE_URL+endpoint, this.buildReqOpts(request)), 10000)
            .then((response: any) => response.json())
            .then(this.responseHandler.bind(this))
            .then(results => {
                results.forEach(result => {
                    if (result.name === RESPONSE_NAMES.SCREEN_GENERIC && !(result as GenericResponse).update) {
                        this.subManager.notifyMissingDataChanged((result as GenericResponse).changedComponents[0].name);
                    }
                })

                if (fn) {
                    fn.forEach(func => func.apply(undefined, []))
                }


                if (!job) {
                    for (let [, value] of this.subManager.jobQueue.entries()) {
                        value();
                    }
                    this.subManager.jobQueue.clear()
                }
                return results;
            }).then(results => {
                resolve(results);
            }).catch(error => {
                console.error(error)
            }).finally(() => {
                this.openRequests.delete(request);
            });
        })

        if (waitForOpenRequests && this.openRequests.size) {
            const singlePromise = promise;
            promise = Promise.all(this.openRequests.values()).then(() => singlePromise);
            this.openRequests.set(request, promise);
        } else {
            this.openRequests.set(request, promise);
        }
        return promise;
    }

    /**
     * Returns a promise which times out and throws an error and displays dialog after given ms
     * @param promise - the promise
     * @param ms - the ms to wait before a timeout
     */
    timeoutRequest(promise: Promise<any>, ms: number) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                this.subManager.emitErrorDialog("server", "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds.");
                reject(new Error("timeOut"))
            }, ms);
            promise.then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.subManager.emitErrorDialog("server", "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds.");
                    clearTimeout(timeoutId);
                    reject(err);
            });
        });
    }

    /** ----------HANDLING-RESPONSES---------- */

    /** A Map which checks which function needs to be called when a response is received */
    responseMap = new Map<string, Function>()
        .set(RESPONSE_NAMES.APPLICATION_META_DATA, this.applicationMetaData.bind(this))
        .set(RESPONSE_NAMES.USER_DATA, this.userData.bind(this))
        .set(RESPONSE_NAMES.MENU, this.menu.bind(this))
        .set(RESPONSE_NAMES.SCREEN_GENERIC, this.generic.bind(this))
        .set(RESPONSE_NAMES.CLOSE_SCREEN, this.closeScreen.bind(this))
        .set(RESPONSE_NAMES.AUTHENTICATION_DATA, this.authenticationData.bind(this))
        .set(RESPONSE_NAMES.DAL_FETCH, this.processFetch.bind(this))
        .set(RESPONSE_NAMES.DAL_META_DATA, this.processMetaData.bind(this))
        .set(RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED, this.processDataProviderChanged.bind(this))
        .set(RESPONSE_NAMES.LOGIN, this.login.bind(this))
        .set(RESPONSE_NAMES.UPLOAD, this.upload.bind(this))
        .set(RESPONSE_NAMES.DOWNLOAD, this.download.bind(this))
        .set(RESPONSE_NAMES.SHOW_DOCUMENT, this.showDocument.bind(this))
        .set(RESPONSE_NAMES.SESSION_EXPIRED, this.sessionExpired.bind(this))
        .set(RESPONSE_NAMES.ERROR, this.showError.bind(this))
        .set(RESPONSE_NAMES.RESTART, this.showRestart.bind(this))
        .set(RESPONSE_NAMES.APPLICATION_PARAMETERS, this.applicationParameters.bind(this))
        .set(RESPONSE_NAMES.LANGUAGE, this.language.bind(this))
        .set(RESPONSE_NAMES.INFORMATION, this.showInfo.bind(this))
        .set(RESPONSE_NAMES.APPLICATION_SETTINGS, this.applicationSettings.bind(this))
        .set(RESPONSE_NAMES.DEVICE_STATUS, this.deviceStatus.bind(this))
        .set(RESPONSE_NAMES.WELCOME_DATA, this.welcomeData.bind(this))
        .set(RESPONSE_NAMES.DIALOG, this.showMessageDialog.bind(this))
        .set(RESPONSE_NAMES.CLOSE_FRAME, this.closeFrame.bind(this));

    /**
     * Calls the correct functions based on the responses received and then calls the routing decider
     * @param responses - the responses received
     */
    async responseHandler(responses: Array<BaseResponse>) {
        // If there is a DataProviderChanged response move it to the start of the responses array
        // to prevent flickering of components.
        responses.forEach((response, idx) => {
            if (response.name === RESPONSE_NAMES.DAL_DATA_PROVIDER_CHANGED) {
                responses.splice(0, 0, responses.splice(idx, 1)[0]);
            }
        });
        for (const [, response] of responses.entries()) {
            const mapper = this.responseMap.get(response.name);
            if (mapper) {
                await mapper(response);
            }
        }
        this.routingDecider(responses);
        return responses;
    }

    /**
     * Sets the clientId in the sessionStorage
     * @param metaData - the applicationMetaDataResponse
     */
    applicationMetaData(metaData: ApplicationMetaDataResponse) {
        sessionStorage.setItem("clientId", metaData.clientId);
        this.appSettings.setApplicationMetaData(metaData);

    }

    /**
     * Calls contentStores handleCustomProperties for every applicationParameter 
     * @param appParams - the applicationParametersResponse
     */
    applicationParameters(appParams:ApplicationParametersResponse) {
        for (const [key, value] of Object.entries(appParams)) {
            if (key !== "name")
                this.contentStore.handleCustomProperties(key, value);
        }
    }

    /**
     * Sets the currentUser in contentStore
     * @param userData - the userDataResponse
     */
    userData(userData: UserDataResponse) {
        this.contentStore.currentUser = userData;
        this.onLoginFunction();
    }

    /**
     * Sets the authKey in localStorage
     * @param authData - the authenticationDataResponse
     */
    authenticationData(authData: AuthenticationDataResponse) {
        localStorage.setItem("authKey", authData.authKey);
    }

    /**
     * Resets the contentStore
     * @param login - the loginDataResponse
     */
    login(login: LoginResponse){
        this.appSettings.setLoginMode(login.mode);
        this.contentStore.reset();
    }


    /**
     * Calls the contentStore updateContent function 
     * @param genericData - the genericResponse
     */
    generic(genericData: GenericResponse) {
        if (genericData.changedComponents && genericData.changedComponents.length) {
            this.contentStore.updateContent(genericData.changedComponents, false);
        }
        if (!genericData.update) {
            let workScreen:IPanel|undefined
            if(genericData.changedComponents && genericData.changedComponents.length) {
                workScreen = genericData.changedComponents[0] as IPanel
                this.contentStore.setActiveScreen({ name: genericData.componentId, className: workScreen ? workScreen.screen_className_ : "" }, workScreen ? workScreen.screen_modal_ : false);
            }
            
            this.onOpenScreenFunction();
        }
    }

    /**
     * Close Screen handling
     * @param closeScreenData - the close screen response 
     */
    closeScreen(closeScreenData: CloseScreenResponse) {
        for (let entry of this.contentStore.flatContent.entries()) {
            if (entry[1].name === closeScreenData.componentId) {
                if ((entry[1] as IPanel).screen_modal_) {
                    this.lastClosedWasPopUp = true;
                }
                else {
                    this.lastClosedWasPopUp = false;
                }
                break;
            }
        }
        this.contentStore.closeScreen(closeScreenData.componentId);
    }

    /**
     * Sets the menuAction for each menuData and passes it to the contentstore and then triggers its update
     * @param menuData - the menuResponse
     */
    menu(menuData: MenuResponse) {
        if (menuData.entries && menuData.entries.length) {
            menuData.entries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                this.contentStore.addMenuItem(entry);
            })
        }
        if (menuData.toolBarEntries && menuData.toolBarEntries.length) {
            menuData.toolBarEntries.forEach(entry => {
                entry.action = () => {
                    return this.api.sendOpenScreenIntern(entry.componentId)
                }
                this.contentStore.addToolbarItem(entry);
            })
        }
        this.onMenuFunction();
        this.subManager.emitMenuUpdate();
        this.subManager.emitToolBarUpdate();
    }

    //Dal
    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
    processRowSelection(selectedRowIndex: number|undefined, dataProvider: string, treePath?:TreePath, selectedColumn?:string){
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;
        if(selectedRowIndex !== -1 && selectedRowIndex !== -0x80000000 && selectedRowIndex !== undefined) {
            /** The data of the row */
            const selectedRow = this.contentStore.getDataRow(compId, dataProvider, selectedRowIndex);
            this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, selectedRowIndex, treePath, selectedColumn);
        } 
        else if(selectedRowIndex === -1) {
            if (treePath !== undefined && treePath.length() > 0) {
                const selectedRow = this.contentStore.getDataRow(compId, dataProvider, treePath.getLast());
                this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, treePath.getLast(), treePath.getParentPath(), selectedColumn)
            }
            else {
                //this.contentStore.clearSelectedRow(compId, dataProvider);
                this.contentStore.setSelectedRow(compId, dataProvider, {}, -1, undefined, selectedColumn)
            }
        }
        else if (selectedRowIndex === undefined && selectedColumn !== undefined) {
            const selectedRow = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider).dataRow;
            const idx = this.contentStore.dataProviderSelectedRow.get(compId)?.get(dataProvider).index;
            this.contentStore.setSelectedRow(compId, dataProvider, selectedRow, idx, treePath, selectedColumn);
        }
    }

    /**
     * Returns the data as array with objects of the columnnames and data merged together
     * @param fetchData - the fetchResponse received
     * @returns the data as array with objects of the columnnames and data merged together
     */
    buildDatasets(fetchData: FetchResponse) {
        //if there are recordformats parse & transform them so that we can map them on a row basis
        const formattedRecords: Record<string, any>[] = [];
        if (fetchData.recordFormat) {
            for (const componentId in fetchData.recordFormat) {
                const entry = fetchData.recordFormat[componentId];
                const styleKeys = ['background', 'foreground', 'font', 'image'];
                const format = entry.format.map(f => f ? f.split(';', 4).reduce((agg, v, i) => v ? {...agg, [styleKeys[i]]: v} : agg, {}) : f);
                entry.records.forEach((r, index) => {
                    if(r.length === 1 && r[0] === -1) {
                        return;
                    }
                    formattedRecords[index] = formattedRecords[index] || {};
                    formattedRecords[index][componentId] = r.reduce<Record<string, any>>((agg, c, index) => {
                        agg[fetchData.columnNames[index]] = format[Math.max(0, Math.min(c, format.length - 1))];
                        return agg;
                    }, {})
                });
            }
        }
        
        return fetchData.records.map((record, index) => {
            const data : any = {
                __recordFormats: formattedRecords[index],
            }
            fetchData.columnNames.forEach((columnName, index) => {
                data[columnName] = record[index];
            });
            return data;
        });
    }

    /**
     * Builds the data and then tells contentStore to update its dataProviderData
     * Also checks if all data of the dataprovider is fetched and sets contentStores dataProviderFetched
     * @param fetchData - the fetchResponse
     * @param referenceKey - the referenced key which should be added to the map
     */
    processFetch(fetchData: FetchResponse, detailMapKey?: string) {
        const builtData = this.buildDatasets(fetchData);
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;
        const tempMap: Map<string, boolean> = new Map<string, boolean>();
        tempMap.set(fetchData.dataProvider, fetchData.isAllFetched);
        this.contentStore.dataProviderFetched.set(compId, tempMap);
                
        // If there is a detailMapKey, call updateDataProviderData with it
        this.contentStore.updateDataProviderData(
            compId, 
            fetchData.dataProvider, 
            builtData, 
            fetchData.to, 
            fetchData.from, 
            fetchData.treePath,
            detailMapKey,
            fetchData.recordFormat,
        );
        
        this.contentStore.setSortDefinition(compId, fetchData.dataProvider, fetchData.sortDefinition ? fetchData.sortDefinition : []);

        const selectedColumn = this.contentStore.dataProviderSelectedRow.get(compId)?.get(fetchData.dataProvider)?.selectedColumn;
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider, fetchData.treePath ? new TreePath(fetchData.treePath) : undefined, fetchData.selectedColumn ? fetchData.selectedColumn : selectedColumn);
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
    async processDataProviderChanged(changedProvider: DataProviderChangedResponse) {
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;

        if (changedProvider.changedColumnNames !== undefined && changedProvider.changedValues !== undefined && changedProvider.selectedRow !== undefined) {
            const changedData:any = _.object(changedProvider.changedColumnNames, changedProvider.changedValues);
            this.contentStore.updateDataProviderData(compId, changedProvider.dataProvider, [changedData], changedProvider.selectedRow, changedProvider.selectedRow);
            const selectedColumn = this.contentStore.dataProviderSelectedRow.get(compId)?.get(changedProvider.dataProvider)?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
        else {
            if(changedProvider.reload === -1) {
                this.contentStore.clearDataFromProvider(compId, changedProvider.dataProvider);
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH, [() => this.subManager.notifyTreeChanged(changedProvider.dataProvider)], true)
            } 
            else if(changedProvider.reload !== undefined) {
                const fetchReq = createFetchRequest();
                fetchReq.rowCount = 1;
                fetchReq.fromRow = changedProvider.reload;
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_ENDPOINTS.FETCH);
            }
            else {
                const selectedColumn = this.contentStore.dataProviderSelectedRow.get(compId)?.get(changedProvider.dataProvider)?.selectedColumn
                this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
            }
        }
    }

    /**
     * Checks if some metaData already exists for this compId and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
    processMetaData(metaData: MetaDataResponse) {
        const compId = this.contentStore.activeScreens[this.contentStore.activeScreens.length - 1].name;
        const existingMap = this.contentStore.dataProviderMetaData.get(compId);
        if (existingMap) {
            existingMap.set(metaData.dataProvider, metaData);
            this.subManager.notifyMetaDataChange(compId, metaData.dataProvider);
        }

        else {
            const tempMap:Map<string, MetaDataResponse> = new Map<string, MetaDataResponse>();
            tempMap.set(metaData.dataProvider, metaData)
            this.contentStore.dataProviderMetaData.set(compId, tempMap);
            this.subManager.notifyMetaDataChange(compId, metaData.dataProvider);
        }
    }

    //Down- & UpLoad

    /**
     * Opens a fileSelectDialog and sends the selected file to the server
     * @param uploadData - the uploadResponse
     */
    upload(uploadData: UploadResponse){
        const inputElem = document.createElement('input');
        inputElem.type = 'file';
        inputElem.click()
        inputElem.onchange = (e) => {
            const formData = new FormData();
            formData.set("clientId", sessionStorage.getItem("clientId") || "")
            formData.set("fileId", uploadData.fileId)
            // @ts-ignore
            formData.set("data", e.target.files[0])
            let reqOpt: RequestInit = {
                method: 'POST',
                body: formData,
                credentials:"include",
            };

            this.timeoutRequest(fetch(this.BASE_URL + REQUEST_ENDPOINTS.UPLOAD, reqOpt), 10000)
                .then((response: any) => response.json())
                .then(this.responseHandler.bind(this))
                .catch(error => console.error(error));
        }
    }

    /**
     * Downloads the file
     * @param downloadData - the downloadResponse
     */
    download(downloadData: DownloadResponse){
        const a = document.createElement('a');
        a.href = downloadData.url.split(';')[0];
        a.setAttribute('download', downloadData.fileName);
        a.click();
    }

    /**
     * Opens a link
     * @param showData - the showDocumentResponse
     */
    showDocument(showData: ShowDocumentResponse) {
        const a = document.createElement('a');
        a.style.display = 'none';
        let splitURL = showData.url.split(';')
        a.href = splitURL[0];
        a.setAttribute('target', splitURL[2]);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * When the session expires send a new startupRequest to the server like in app and reset the contentStore
     * @param expData - the sessionExpiredResponse
     */
    sessionExpired(expData: SessionExpiredResponse) {
        const urlParams = new URLSearchParams(window.location.search);
        const startUpRequest = createStartupRequest();
        const authKey = localStorage.getItem("authKey");
        if (!this.embeddedOptions) {
            if(urlParams.has("appName") && urlParams.has("baseUrl")){
                startUpRequest.applicationName = urlParams.get("appName") as string;
                // this.APP_NAME = urlParams.get("appName");
                //let baseUrl = urlParams.get("baseUrl") as string;
                // if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                //     baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                // }
                // this.BASE_URL = baseUrl;
                // this.RESOURCE_URL = baseUrl + "/resource/" + urlParams.get("appName");
            }
            if (urlParams.has("userName") && urlParams.has("password")) {
                startUpRequest.password = urlParams.get("password") as string;
                startUpRequest.userName = urlParams.get("userName") as string;
            }
        }
        else {
            if (this.embeddedOptions.appName && this.embeddedOptions.baseUrl) {
                startUpRequest.applicationName = this.embeddedOptions.appName;
                // this.APP_NAME = this.embeddedOptions.appName;
                // let baseUrl = this.embeddedOptions.baseUrl;
                // if (baseUrl.charAt(baseUrl.length - 1) === "/") {
                //     baseUrl = baseUrl.substring(0, baseUrl.length - 1);
                // }
                // this.BASE_URL = baseUrl;
                // this.RESOURCE_URL = baseUrl + "/resource/" + this.embeddedOptions.appName
            }
        }
        if(authKey){
            startUpRequest.authKey = authKey;
        }
        startUpRequest.screenHeight = window.innerHeight;
        startUpRequest.screenWidth = window.innerWidth;
        startUpRequest.deviceMode = "desktop";
        this.contentStore.reset();
        sessionStorage.clear();
        //this.sendRequest(startUpRequest, REQUEST_ENDPOINTS.STARTUP);
        this.subManager.emitSessionExpired();
        this.routingDecider([expData]);
        this.subManager.emitMessage({message: expData.title, name: ""}, "error");
        console.error(expData.title)
    }

    /**
     * Shows a toast with the error message
     * @param errData - the errorResponse
     */
    showError(errData: ErrorResponse) {
        if (!errData.silentAbort) {
            this.subManager.emitMessage(errData, "error");
        }
        console.error(errData.details)
    }

    showInfo(infoData: MessageResponse) {
        this.subManager.emitMessage(infoData, "error");
    }

    showMessageDialog(dialogData:DialogResponse) {
        this.subManager.emitMessageDialog("message-dialog", dialogData)
    }
 
    /**
     * Shows a toast that the site needs to be reloaded
     * @param reData - the restartResponse
     */
    showRestart(reData:RestartResponse) {
        this.subManager.emitMessage({ message: 'Reload Page: ' + reData.info, name: "" }, "error")
        console.warn(reData.info);
    }

    /**
     * Fetches the languageResource and fills the translation map
     * @param langData - the language data
     */
    language(langData:LanguageResponse) {
        this.timeoutRequest(fetch(this.RESOURCE_URL + langData.languageResource), 2000)
        .then((response:any) => response.text())
        .then(value => parseString(value, (err, result) => { 
            result.properties.entry.forEach((entry:any) => this.contentStore.translation.set(entry.$.key, entry._));
            this.subManager.emitTranslation();
        }))
    }

    /** 
     * Sets the application-settings and notifies the subscribers
     * @param appSettings
     */
    applicationSettings(appSettings:ApplicationSettingsResponse) {
        this.appSettings.setVisibleButtons(appSettings.reload, appSettings.rollback, appSettings.save);
        this.appSettings.setChangePasswordEnabled(appSettings.changePassword);
        this.appSettings.setMenuVisibility(appSettings.menuBar, appSettings.toolBar);
        if (appSettings.desktop && appSettings.desktop.length) {
            if (appSettings.desktop[0].className === "DesktopPanel") {
                this.appSettings.setDesktopPanel(appSettings.desktop[0]);
            }
            this.contentStore.updateContent(appSettings.desktop, true);
        }
        this.subManager.emitAppSettings(appSettings);
    }

    /**
     * Sets the device-status in app-settings and triggers an event to update the subscribers
     * @param deviceStatus - the device-status response
     */
    deviceStatus(deviceStatus:DeviceStatusResponse) {
        this.appSettings.setDeviceStatus(deviceStatus.layoutMode);
        this.subManager.emitDeviceMode(deviceStatus.layoutMode);
    }

    /**
     * Sets the welcome-screen in app-settings
     * @param welcomeData - the welcome-data response
     */
    welcomeData(welcomeData:WelcomeDataResponse) {
        this.appSettings.setWelcomeScreen(welcomeData.homeScreen);
    }

    closeFrame(closeFrameData:CloseFrameResponse) {
        this.subManager.emitCloseFrame(closeFrameData.componentId);
    }

    /** ----------ROUTING---------- */

    /**
     * Decides if and where to the user should be routed based on all responses.
     * When the user is redirected to login, or gets auto logged in, app is set to ready
     * @param responses - the response array
     */
    routingDecider(responses: Array<BaseResponse>) {
        let routeTo: string | undefined;
        let highestPriority = 0;

        responses.forEach(response => {
            if (response.name === RESPONSE_NAMES.USER_DATA) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    routeTo = "home";
                    this.subManager.emitAppReady();
                }
            }
            else if (response.name === RESPONSE_NAMES.SCREEN_GENERIC) {
                const GResponse = (response as GenericResponse);
                let firstComp;
                if (GResponse.changedComponents && GResponse.changedComponents.length) {
                    firstComp = GResponse.changedComponents[0] as IPanel
                }
                if (!GResponse.update && firstComp && !firstComp.screen_modal_) {
                    if (highestPriority < 2) {
                        highestPriority = 2;
                        routeTo = "home/" + this.contentStore.navigationNames.get(GResponse.componentId);
                    }
                }
            }
            else if (response.name === RESPONSE_NAMES.CLOSE_SCREEN) {
                const CSResponse = (response as CloseScreenResponse);
                
                //let's do a sanitycheck in case of a reload by checking if the screen to close 
                //should actually be opened by the same request
                if(responses.find(r => 
                    r.name === RESPONSE_NAMES.SCREEN_GENERIC 
                    && (r as GenericResponse).componentId === CSResponse.componentId
                )) {
                    //count how many components for that screen there are
                    let c = 0;
                    this.contentStore.flatContent.forEach((value) => {
                        if(value.name === CSResponse.componentId) {
                            c++;
                        }
                    });
                    //if there is only one don't remove it
                    if(c <= 1) {
                        return;
                    }
                }
                
                if (highestPriority < 1 && !this.lastClosedWasPopUp) {
                    highestPriority = 1;
                    routeTo = "home";
                }
            }
            else if (response.name === RESPONSE_NAMES.LOGIN || response.name === RESPONSE_NAMES.SESSION_EXPIRED) {
                if (highestPriority < 1) {
                    highestPriority = 1;
                    routeTo = "login";
                    this.subManager.emitAppReady();
                }
            }
            //    else if (response.name === "settings") {
            //        routeTo = "home/settings";
            //    }
        });


        if (routeTo) {
            //window.location.hash = "/"+routeTo
            this.history?.push(`/${routeTo}`);
        }
    }
}
export default Server