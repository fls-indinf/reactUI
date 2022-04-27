import { History } from "history";
import _ from "underscore";
import API from "../API";
import AppSettings from "../AppSettings";
import { IPanel } from "../components/panels";
import BaseContentStore, { IDataBook } from "../contentstore/BaseContentStore";
import ContentStore from "../contentstore/ContentStore";
import ContentStoreV2 from "../contentstore/ContentStoreV2";
import { createFetchRequest } from "../factories/RequestFactory";
import TreePath from "../model/TreePath";
import { REQUEST_KEYWORDS } from "../request";
import { ApplicationMetaDataResponse, BaseResponse, CloseScreenResponse, DataProviderChangedResponse, DeviceStatusResponse, FetchResponse, MetaDataResponse, RESPONSE_NAMES, SessionExpiredResponse } from "../response";
import { RequestQueueMode } from "../Server";
import { SubscriptionManager } from "../SubscriptionManager";

export default abstract class BaseServer {
    /** Contentstore instance */
    contentStore: BaseContentStore|ContentStore|ContentStoreV2;

    /** SubscriptionManager instance */
    subManager:SubscriptionManager;
    
    /** AppSettings instance */
    appSettings:AppSettings;
    
    /** the react routers history object */
    history?:History<any>;
    
    /** a map of still open requests */
    openRequests: Map<any, Promise<any>>;

    /** API instance */
    api:API;

    /** Base url for requests */
    BASE_URL = "";

    /** Resource url for receiving images etc. */
    RESOURCE_URL = "";

    /** the request queue */
    requestQueue: Function[] = [];

    /** flag if a request is in progress */
    requestInProgress = false;

    /** The string to open the screen of the last opened screen */
    lastOpenedScreen = "";

    /** An array of dataproviders on which dataproviders data is missing and needs to be fetched */
    missingDataFetches:string[] = [];

    /** How long before a timeout occurs */
    timeoutMs = 10000;

    /**
     * @constructor constructs server instance
     * @param store - contentstore instance
     * @param subManager - subscription-manager instance
     * @param history - the history
     */
     constructor(store: ContentStore|ContentStoreV2, subManager:SubscriptionManager, appSettings:AppSettings, history?: History<any>) {
        this.contentStore = store;
        this.subManager = subManager;
        this.appSettings = appSettings;
        this.history = history;
        this.openRequests = new Map<any, Promise<any>>();
        this.api = new API(this, store, appSettings, subManager, history);
    }

    /** Sets the api of the server instance */
    setAPI(api:API) {
        this.api = api;
    }

    /**
     * Returns true, if the component exists in the flat-content of the contentstore
     * @param name - the name of the component
     */
    abstract componentExists(name:string): boolean;

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

    /** A Map which has a simplified the endpoints names as keys and the actual endpoint as value */
    abstract endpointMap:Map<string, string>;

    /**
     * Sends a request to the server and handles its response, if there are jobs in the
     * SubscriptionManagers JobQueue, call them after the response handling is complete
     * @param request - the request to send
     * @param endpoint - the endpoint to send the request to
     * @param fn - a function called after the request is completed
     * @param job - if false or not set job queue is cleared
     * @param waitForOpenRequests - if true the request result waits until all currently open immediate requests are finished as well
     * @param queueMode - controls how the request is dispatched
     *  - RequestQueueMode.QUEUE: default, requests are sent one after another
     *  - RequestQueueMode.IMMEDIATE: request is sent immediately
     */
     sendRequest(
        request: any, 
        endpoint: string, 
        fn?: Function[], 
        job?: boolean, 
        waitForOpenRequests?: boolean,
        queueMode: RequestQueueMode = RequestQueueMode.QUEUE,
    ) {
        let promise = new Promise<any>((resolve, reject) => {
            if (
                request.componentId 
                && endpoint !== REQUEST_KEYWORDS.OPEN_SCREEN 
                && endpoint !== REQUEST_KEYWORDS.CLOSE_FRAME 
                && !this.componentExists(request.componentId)
            ) {
                reject("Component doesn't exist");
            } else {
                if (queueMode == RequestQueueMode.IMMEDIATE) {
                    let finalEndpoint = this.endpointMap.get(endpoint);
                    this.timeoutRequest(
                        fetch(this.BASE_URL + finalEndpoint, this.buildReqOpts(request)), 
                        this.timeoutMs, 
                        () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests, queueMode)
                    )
                        .then((response: any) => response.headers.get("content-type") === "application/json" ? response.json() : Promise.reject("no valid json"))
                        .then(result => {
                            if (this.appSettings.applicationMetaData.aliveInterval) {
                                this.contentStore.restartAliveSending(this.appSettings.applicationMetaData.aliveInterval);
                            }
                            
                            if (result.code) {
                                if (400 <= result.code && result.code <= 599) {
                                    return Promise.reject(result.code + " " + result.reasonPhrase + ". " + result.description);
                                }
                            }
                            return result;
                        }, (err) => Promise.reject(err))
                        .then(this.responseHandler.bind(this), (err) => Promise.reject(err))
                        .then(results => {
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
                        })
                        .then(results => {
                            resolve(results)
                        }, (err) => Promise.reject(err))
                        .catch(error => {
                            if (typeof error === "string") {
                                const splitErr = error.split(".");
                                const code = error.substring(0, 3);
                                if (code === "410") {
                                    this.subManager.emitDialog("server", false, true, splitErr[0], splitErr[1] + ". <u>Click here!</u> or press Escape to retry!");
                                }
                                else {
                                    this.subManager.emitDialog("server", false, false, splitErr[0], splitErr[1], () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests));
                                }
                            }
                            else {
                                this.subManager.emitDialog("server", false, false, "Error occured!", "Check the console for more info.", () => this.sendRequest(request, endpoint, fn, job, waitForOpenRequests));
                            }
                            if (error !== "no valid json") {
                                this.subManager.emitErrorDialogVisible(true);
                            }
                            reject(error);
                            console.error(error);
                        }).finally(() => {
                            this.openRequests.delete(request);
                        });
                } else {
                    this.requestQueue.push(() => this.sendRequest(
                        request, 
                        endpoint,
                        fn,
                        job,
                        waitForOpenRequests,
                        RequestQueueMode.IMMEDIATE
                    ).then(results => {
                        resolve(results)
                    }))
                    this.advanceRequestQueue();
                }
            }
        })

        if (queueMode == RequestQueueMode.IMMEDIATE) {
            if (waitForOpenRequests && this.openRequests.size) {
                const singlePromise = promise;
                promise = Promise.all(this.openRequests.values()).then(() => singlePromise);
                this.openRequests.set(request, promise);
            } else {
                this.openRequests.set(request, promise);
            }
        }

        return promise;
    }

    advanceRequestQueue() {
        if(!this.requestInProgress) {
            const request = this.requestQueue.shift();
            if (request) {
                this.requestInProgress = true;
                request().catch(() => {}).finally(() => {
                    this.requestInProgress = false;
                    this.advanceRequestQueue();
                });
            }
        }
    }

    /**
     * Returns a promise which times out and throws an error and displays dialog after given ms
     * @param promise - the promise
     * @param ms - the ms to wait before a timeout
     */
    timeoutRequest(promise: Promise<any>, ms: number, retry?:Function) {
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                this.subManager.emitDialog("server", false, false, "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds. <u>Click here!</u> or press Escape to retry!", retry);
                this.subManager.emitErrorDialogVisible(true);
                reject(new Error("timeOut"))
            }, ms);
            promise.then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    this.subManager.emitDialog("server", false, false, "Server Error!", "TimeOut! Couldn't connect to the server after 10 seconds. <u>Click here</u> or press Escape to retry!", retry);
                    this.subManager.emitErrorDialogVisible(true);
                    clearTimeout(timeoutId);
                    reject(err);
            });
        });
    }

    /** ----------HANDLING-RESPONSES---------- */

    abstract closeScreen(closeScreenData: CloseScreenResponse):void

    abstract dataResponseMap: Map<string, Function>;

    /** A Map which checks which function needs to be called when a response is received */
    abstract responseMap: Map<string, Function>;

    async responseHandler(responses: Array<BaseResponse>) {
        // If there is a DataProviderChanged response move it to the start of the responses array
        // to prevent flickering of components.
        if (Array.isArray(responses)) {
            responses.sort((a, b) => {
                if (a.name === RESPONSE_NAMES.CLOSE_SCREEN && b.name !== RESPONSE_NAMES.CLOSE_SCREEN) {
                    return -1;
                }
                else if (b.name === RESPONSE_NAMES.CLOSE_SCREEN && a.name !== RESPONSE_NAMES.CLOSE_SCREEN) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            if (responses.length && responses[0].name === RESPONSE_NAMES.CLOSE_SCREEN) {
                this.closeScreen(responses[0] as CloseScreenResponse)
            }

            for (const [, response] of responses.entries()) {
                const mapper = this.dataResponseMap.get(response.name);
                if (mapper) {
                    await mapper(response);
                }
            }

            for (const [, response] of responses.entries()) {
                const mapper = this.responseMap.get(response.name);
                if (mapper) {
                    await mapper(response);
                }
            }
        }
        return responses;
    }

    /**
     * Sets the clientId in the sessionStorage
     * @param metaData - the applicationMetaDataResponse
     */
     applicationMetaData(metaData: ApplicationMetaDataResponse) {
        sessionStorage.setItem("clientId", metaData.clientId);
        this.RESOURCE_URL = this.BASE_URL + "/resource/" + metaData.applicationName;
        this.appSettings.setApplicationMetaData(metaData);
    }

    abstract getScreenName(dataProvider:string): string;

    /**
     * Sets the selectedRow, if selectedRowIndex === -1 clear selectedRow and trigger selectedRow update
     * @param selectedRowIndex - the index of the selectedRow
     * @param dataProvider - the dataprovider
     */
     processRowSelection(selectedRowIndex: number|undefined, dataProvider: string, treePath?:TreePath, selectedColumn?:string) {
        const screenName = this.getScreenName(dataProvider);
        if(selectedRowIndex !== -1 && selectedRowIndex !== -0x80000000 && selectedRowIndex !== undefined) {
            /** The data of the row */
            const selectedRow = this.contentStore.getDataRow(screenName, dataProvider, selectedRowIndex);
            this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, selectedRowIndex, treePath, selectedColumn);
        } 
        else if(selectedRowIndex === -1) {
            if (treePath !== undefined && treePath.length() > 0) {
                const selectedRow = this.contentStore.getDataRow(screenName, dataProvider, treePath.getLast());
                this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, treePath.getLast(), treePath.getParentPath(), selectedColumn)
            }
            else {
                //this.contentStore.clearSelectedRow(screenName, dataProvider);
                this.contentStore.setSelectedRow(screenName, dataProvider, {}, -1, undefined, selectedColumn)
            }
        }
        else if (selectedRowIndex === undefined && selectedColumn !== undefined) {
            if(this.contentStore.getDataBook(screenName, dataProvider)?.selectedRow) {
                const selectedRow = this.contentStore.getDataBook(screenName, dataProvider)!.selectedRow!.dataRow;
                const idx = this.contentStore.getDataBook(screenName, dataProvider)!.selectedRow!.index;
                this.contentStore.setSelectedRow(screenName, dataProvider, selectedRow, idx, treePath, selectedColumn);
            }
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

                        if (index === r.length - 1 && fetchData.columnNames.length > r.length) {
                            for (let i =  index; i < fetchData.columnNames.length; i++) {
                                agg[fetchData.columnNames[i]] = format[Math.max(0, Math.min(c, format.length - 1))];
                            }
                        }
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
            data.recordStatus = record[Object.keys(record).length-1]
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
        const screenName = this.getScreenName(fetchData.dataProvider);
        const tempMap: Map<string, boolean> = new Map<string, boolean>();
        tempMap.set(fetchData.dataProvider, fetchData.isAllFetched);
        // If there is a detailMapKey, call updateDataProviderData with it
        this.contentStore.updateDataProviderData(
            screenName, 
            fetchData.dataProvider, 
            builtData, 
            fetchData.to, 
            fetchData.from, 
            fetchData.treePath,
            detailMapKey,
            fetchData.recordFormat,
            fetchData.clear
        );

        if (this.contentStore.getDataBook(screenName, fetchData.dataProvider)) {
            this.contentStore.getDataBook(screenName, fetchData.dataProvider)!.allFetched = fetchData.isAllFetched
        }
        
        this.contentStore.setSortDefinition(screenName, fetchData.dataProvider, fetchData.sortDefinition ? fetchData.sortDefinition : []);

        const selectedColumn = this.contentStore.getDataBook(screenName, fetchData.dataProvider)?.selectedRow?.selectedColumn;
        this.processRowSelection(fetchData.selectedRow, fetchData.dataProvider, fetchData.treePath ? new TreePath(fetchData.treePath) : undefined, fetchData.selectedColumn ? fetchData.selectedColumn : selectedColumn);

        if (this.missingDataFetches.includes(fetchData.dataProvider)) {
            this.missingDataFetches.splice(this.missingDataFetches.indexOf(fetchData.dataProvider), 1);
        }
    }

    /**
     * Fetches new data from the server depending on reload property:
     * if reload is -1 clear the current data for this dataprovider from the contentstore and re-fetch it
     * if reload is a number fetch from the reload value one row
     * @param changedProvider - the dataProviderChangedResponse
     */
     async processDataProviderChanged(changedProvider: DataProviderChangedResponse) {
        const screenName = this.getScreenName(changedProvider.dataProvider);

        if (changedProvider.insertEnabled !== undefined 
            || changedProvider.updateEnabled !== undefined 
            || changedProvider.deleteEnabled !== undefined 
            || changedProvider.readOnly !== undefined
            || changedProvider.changedColumns !== undefined) {
            this.contentStore.updateMetaData(
                screenName, 
                changedProvider.dataProvider, 
                changedProvider.insertEnabled, 
                changedProvider.updateEnabled, 
                changedProvider.deleteEnabled, 
                changedProvider.readOnly,
                changedProvider.changedColumns
            );
        }
        if (changedProvider.deletedRow !== undefined) {
            const compPanel = this.contentStore.getComponentByName(screenName) as IPanel;
            this.contentStore.deleteDataProviderData(screenName, changedProvider.dataProvider, changedProvider.deletedRow);
            this.subManager.notifyDataChange(screenName, changedProvider.dataProvider);
            this.subManager.notifyScreenDataChange(screenName);
            if (compPanel && this.contentStore.isPopup(compPanel) && this.contentStore.getScreenDataproviderMap(changedProvider.dataProvider.split('/')[1])) {
                this.subManager.notifyDataChange(changedProvider.dataProvider.split('/')[1], changedProvider.dataProvider);
                this.subManager.notifyScreenDataChange(changedProvider.dataProvider.split('/')[1]);
            }
        }

        if (changedProvider.changedColumnNames !== undefined && changedProvider.changedValues !== undefined && changedProvider.selectedRow !== undefined) {
            const changedData:any = _.object(changedProvider.changedColumnNames, changedProvider.changedValues);
            this.contentStore.updateDataProviderData(screenName, changedProvider.dataProvider, [changedData], changedProvider.selectedRow, changedProvider.selectedRow);
            const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn
            this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
        }
        else {
            if(changedProvider.reload === -1) {
                this.contentStore.clearDataFromProvider(screenName, changedProvider.dataProvider);
                const fetchReq = createFetchRequest();
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, [() => this.subManager.notifyTreeChanged(changedProvider.dataProvider)], true, undefined, RequestQueueMode.IMMEDIATE)
            } 
            else if(changedProvider.reload !== undefined) {
                const fetchReq = createFetchRequest();
                fetchReq.rowCount = 1;
                fetchReq.fromRow = changedProvider.reload;
                fetchReq.dataProvider = changedProvider.dataProvider;
                await this.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, undefined, undefined, undefined, RequestQueueMode.IMMEDIATE);
            }
            else {
                const selectedColumn = this.contentStore.getDataBook(screenName, changedProvider.dataProvider)?.selectedRow?.selectedColumn;
                this.processRowSelection(changedProvider.selectedRow, changedProvider.dataProvider, changedProvider.treePath ? new TreePath(changedProvider.treePath) : undefined, changedProvider.selectedColumn ? changedProvider.selectedColumn : selectedColumn);
            }
        }
    }

    /**
     * Checks if some metaData already exists for this screenName and either sets new/updated metaData in existing map or creates new map for metadata
     * @param metaData - the metaDataResponse
     */
     processMetaData(metaData: MetaDataResponse) {
        this.contentStore.setMetaData(this.getScreenName(metaData.dataProvider), metaData);
    }

    /**
     * When the session expires send a new startupRequest to the server like in app and reset the contentStore
     * @param expData - the sessionExpiredResponse
     */
     sessionExpired(expData: SessionExpiredResponse) {
        this.subManager.emitDialog("server", true, false, this.contentStore.translation.get("Session expired!"), this.contentStore.translation.get("Take note of any unsaved data, and <u>click here</u> or press ESC to continue."));
        this.subManager.emitErrorDialogVisible(true);
        this.contentStore.reset();
        sessionStorage.clear();
        console.error(expData.title);
    }

    /**
     * Sets the device-status in app-settings and triggers an event to update the subscribers
     * @param deviceStatus - the device-status response
     */
     deviceStatus(deviceStatus:DeviceStatusResponse) {
        this.appSettings.setDeviceStatus(deviceStatus.layoutMode);
        this.appSettings.setMenuCollapsed(["Small", "Mini"].indexOf(deviceStatus.layoutMode) !== -1);
        this.subManager.emitDeviceMode(deviceStatus.layoutMode);
    }
}