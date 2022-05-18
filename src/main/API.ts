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

/** Other imports */
import Server from "./server/Server";
import ContentStore from "./contentstore/ContentStore";
import { createCloseScreenRequest, createOpenScreenRequest, createSetScreenParameterRequest, createInsertRecordRequest, createSelectRowRequest } from "./factories/RequestFactory";
import { ServerMenuButtons } from "./response";
import AppSettings, { appVersion } from "./AppSettings";
import { CustomMenuItem, CustomStartupProps, CustomToolbarItem, EditableMenuItem, ScreenWrapperOptions } from "./util/types/custom-types";
import { History } from "history";
import React, { ReactElement } from "react";
import BaseComponent from "./util/types/BaseComponent";
import { SubscriptionManager } from "./SubscriptionManager";
import { REQUEST_KEYWORDS } from "./request";
import BaseServer from "./server/BaseServer";
import ServerV2 from "./server/ServerV2";
import BaseContentStore from "./contentstore/BaseContentStore";
import ContentStoreV2 from "./contentstore/ContentStoreV2";

/** Contains the API functions */
class API {
    /**
     * @constructor constructs api instance
     * @param server - server instance
     */
    constructor (server: BaseServer|Server|ServerV2, store:BaseContentStore|ContentStore|ContentStoreV2, appSettings:AppSettings, sub:SubscriptionManager, history?:History<any>) {
        this.#server = server;
        this.#contentStore = store;
        this.#appSettings = appSettings;
        this.history = history;
        this.#subManager = sub;
    }

    /** Server instance */
    #server: BaseServer|Server|ServerV2;
    /** Contentstore instance */
    #contentStore: BaseContentStore|ContentStore|ContentStoreV2
    /** AppSettings instance */
    #appSettings: AppSettings
    /** the react routers history object */
    history?: History<any>;
    /** Subscription-Manager instance */
    #subManager: SubscriptionManager

    setContentStore(store: BaseContentStore|ContentStore|ContentStoreV2) {
        this.#contentStore = store;
    }

    setServer(server: BaseServer|Server|ServerV2) {
        this.#server = server;
    }

    sendRequest(req: any, endpoint: string) {
        this.#server.sendRequest(req, endpoint);
    }

    /**
     * Sends an open-screen-request to the server to open a workscreen
     * @param id - the id of the screen opened
     * @param parameter - optional parameters that are being sent to the server
     * @param useClassName - true, if the screen is opened with the classname instead of the component id
     */
    sendOpenScreenRequest(id:string, parameter?: { [key: string]: any }) {
        const openReq = createOpenScreenRequest();
        openReq.className = id;
        if (parameter) {
            openReq.parameter = parameter;
        }

        this.#server.lastOpenedScreen = id;

        return this.#server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN);
    }

    sendOpenScreenIntern(id:string) {
        const openReq = createOpenScreenRequest();
        openReq.componentId = id;

        this.#server.lastOpenedScreen = id;

        return this.#server.sendRequest(openReq, REQUEST_KEYWORDS.OPEN_SCREEN);
    }

    /**
     * Sends screen-parameters for the given screen to the server.
     * @param screenName - the screen-name
     * @param parameter - the screen-parameters
     */
    sendScreenParameter(screenName: string, parameter: { [key: string]: any }) {
        const parameterReq = createSetScreenParameterRequest();
        parameterReq.componentId = screenName;
        parameterReq.parameter = parameter;
        this.#server.sendRequest(parameterReq, REQUEST_KEYWORDS.SET_SCREEN_PARAMETER);
    }

    /**
     * Sends a closeScreenRequest to the server for the given screen.
     * @param screenName - the screen to be closed
     */
    sendCloseScreenRequest(id: string, parameter?: { [key: string]: any }, popup?:boolean) {
        if (appVersion.version !== 2) {
            const csRequest = createCloseScreenRequest();
            csRequest.componentId = id;
            if (parameter) {
                csRequest.parameter = parameter;
            }
            //TODO topbar
            this.#server.sendRequest(csRequest, REQUEST_KEYWORDS.CLOSE_SCREEN).then(res => {
                if (res[0] === undefined || res[0].name !== "message.error") {
                    if (popup) {
                        (this.#server as Server).lastClosedWasPopUp = true;
                    }
                    else {
                        (this.#server as Server).lastClosedWasPopUp = false;
                    }
                    this.#contentStore.closeScreen(id, false);
                    this.history?.push("/home")
                }
            });
        }

    }

    /**
     * Inserts a record into the given dataprovider
     * @param id - the id of the screen
     * @param dataProvider - the dataprovider which should be used
     */
    insertRecord(id:string, dataProvider:string) {
        this.#contentStore.insertDataProviderData(id, dataProvider);
        const insertReq = createInsertRecordRequest();
        insertReq.dataProvider = dataProvider;
        this.sendRequest(insertReq, REQUEST_KEYWORDS.INSERT_RECORD);
    }

    /**
     * Deletes a record from the given dataprovider
     * @param id - the id of the screen
     * @param name - the name of the component
     * @param dataProvider - the dataprovider which should be used
     */
    deleteRecord(id:string, name:string, dataProvider:string) {
        this.#contentStore.deleteDataProviderData(id, dataProvider);
        const deleteReq = createSelectRowRequest();
        deleteReq.dataProvider = dataProvider;
        deleteReq.componentId = name;
        this.sendRequest(deleteReq, REQUEST_KEYWORDS.DELETE_RECORD);
    }

    /**
     * Adds a custom-screen to the application.
     * @param id - the id/name of the custom-screen
     * @param screen - the custom-screen to be added
     */
    addCustomScreen(id:string, screen:ReactElement) {
        this.#contentStore.customScreens.set(id, () => screen);
    }

    /**
     * Replaces a current screen sent by the server, based on the given id, with a custom-screen.
     * @param id - the id of the screen which will be replaced
     * @param screen - the custom-screen which will replace the screen
     */
    addReplaceScreen(id:string, screen:ReactElement) {
        this.#contentStore.replaceScreens.set(id, (x:any) => React.cloneElement(screen, x));
    }

    /**
     * Adds a screen-wrapper to a workscreen.
     * @param id - the id of the screen which will receive a screen-wrapper
     * @param wrapper - the screen-wrapper which will be added
     * @param pOptions - options of the screen-wrapper currently global:boolean
     */
    addScreenWrapper(id:string, wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        this.#contentStore.screenWrappers.set(id, {wrapper: wrapper, options: pOptions ? pOptions : { global: true }});
    }

    /**
     * Adds a menu-item to your application.
     * @param menuItem - the menu-item to be added
     */
    addMenuItem(menuItem: CustomMenuItem) {
        if (this.#contentStore.customScreens.has(menuItem.id)) {
            const menuGroup = (this.#contentStore as ContentStore).menuItems.get(menuItem.menuGroup);
            const itemAction = () => {
                this.#contentStore.setActiveScreen({ name: menuItem.id, id: "", className: undefined });
                this.history?.push("/home/" + menuItem.id);
                return Promise.resolve(true);
            };
            const newItem: ServerMenuButtons = {
                componentId: menuItem.id,
                text: menuItem.text,
                group: menuItem.menuGroup,
                image: menuItem.icon ? menuItem.icon.substring(0, 2) + " " + menuItem.icon : "",
                action: itemAction
            };
            if (menuGroup) {
                menuGroup.push(newItem);
            }
            else {
                (this.#contentStore as ContentStore).menuItems.set(menuItem.menuGroup, [newItem]);
            }
        }
        else {
            this.#subManager.emitToast({ message: "Error while adding the menu-item. Could not find id: " + menuItem.id + "! Maybe the Custom-Screen isn't registered yet.", name: "" }, "error");
            console.error("Error while adding the menu-item. Could not find id: " + menuItem.id + "! Maybe the Custom-Screen isn't registered yet.");
        }
    }

    /**
     * Edits an existing menu-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new menu-item info
     */
    editMenuItem(editItem: EditableMenuItem) {
        let itemToEdit: ServerMenuButtons | undefined;
        let itemFound: boolean = false;
        (this.#contentStore as ContentStore).menuItems.forEach(menuGroup => {
            itemToEdit = menuGroup.find(menuItem => menuItem.componentId.split(':')[0] === editItem.id);
            if (itemToEdit) {
                itemFound = true;
                if (editItem.newTitle) {
                    itemToEdit.text = editItem.newTitle;
                }
                if (editItem.newIcon) {
                    itemToEdit.image = editItem.newIcon.substring(0, 2) + " " + editItem.newIcon;
                }
            }
        });
        if (!itemFound) {
            this.#subManager.emitToast({ message: "Error while editing the menu-item. Could not find id: " + editItem.id + "!", name: "" }, "error");
            console.error("Error while editing the menu-item. Could not find id: " + editItem.id + "!");
        }
    }

    /**
     * Removes a menu-item, which the server sends, from your application
     * @param id - the id of the menu-item which should be removed
     */
    removeMenuItem(id:string) {
        let itemToRemoveIndex:number = -1;
        let itemFound: boolean = false;
        (this.#contentStore as ContentStore).menuItems.forEach(menuGroup => {
            itemToRemoveIndex = menuGroup.findIndex(menuItem => menuItem.componentId.split(':')[0] === id);
            if (itemToRemoveIndex !== -1) {
                itemFound = true;
                menuGroup.splice(itemToRemoveIndex, 1);
            }
        });
        if (!itemFound) {
            this.#subManager.emitToast({ message: "Error removing the menu-item. Could not find id: " + id + "!", name: "" }, "error");
            console.error("Error removing the menu-item. Could not find id: " + id + "!");
        }
    }

    /**
     * Adds an item to the toolbar
     * @param toolbarItem - the toolbar-item to be added
     */
    addToolbarItem(toolbarItem: CustomToolbarItem) {
        const itemAction = () => {
            if (this.#contentStore.customScreens.has(toolbarItem.id)) {
                this.#contentStore.setActiveScreen({name: toolbarItem.id, id: "", className: undefined });
                this.history?.push("/home/" + toolbarItem.id);
                return Promise.resolve(true);
            }
            else {
                return this.sendOpenScreenRequest(toolbarItem.id);
            }
        }
        (this.#contentStore as ContentStore).addToolbarItem({ 
            componentId: toolbarItem.id, 
            text: toolbarItem.title, 
            image: toolbarItem.icon.substring(0, 2) + " " + toolbarItem.icon, 
            action: itemAction 
        });
    }

    /**
     * Edits an existing toolbar-item the server sends.
     * @param editItem - the EditableMenuItem object which holds the new toolbar-item info
     */
    editToolbarItem(editItem:EditableMenuItem) {
        let itemToEdit = (this.#contentStore as ContentStore).toolbarItems.find(item => item.componentId.split(':')[0] === editItem.id);
        if (itemToEdit) {
            if (editItem.newTitle) {
                itemToEdit.text = editItem.newTitle;
            }
            if (editItem.newIcon) {
                itemToEdit.image = editItem.newIcon.substring(0, 2) + " " + editItem.newIcon;
            }
        }
        else {
            this.#subManager.emitToast({ message: "Error while editing the toolbar-item. Could not find id: " + editItem.id + "!", name: "" }, "error");
            console.error("Error while editing the toolbar-item. Could not find id: " + editItem.id + "!");
        }
    }

    /**
     * Removes a toolbar-item, which the server sends, from the toolbar
     * @param id 
     */
    removeToolbarItem(id:string) {
        let itemToRemoveIndex:number = (this.#contentStore as ContentStore).toolbarItems.findIndex(item => item.componentId.split(':')[0] === id);
        if (itemToRemoveIndex !== -1) {
            (this.#contentStore as ContentStore).toolbarItems.splice(itemToRemoveIndex, 1);
        }
        else {
            this.#subManager.emitToast({ message: "Error while removing the toolbar-item. Could not find id: " + id + "!", name: "" }, "error");
            console.error("Error while removing the toolbar-item. Could not find id: " + id + "!");
        }
    }

    /**
     * Adds properties which will be sent on startup
     * @param startupProps - the startup-properties to be sent
     */
    addStartupProperties(startupProps:CustomStartupProps[]) {
        this.#contentStore.setStartupProperties(startupProps);
    }

    /**
     * Replaces an existing component of a screen with a custom-component
     * @param name - the name of the component, which should be replaced
     * @param customComp - the custom-component
     */
    addCustomComponent(name:string, customComp:ReactElement) {
        if (this.#contentStore.getComponentByName(name)) {
            this.#contentStore.customComponents.set(name, () => customComp);
            const comp = this.#contentStore.getComponentByName(name) as BaseComponent;
            const notifyList = new Array<string>();
            if (comp.parent) {
                notifyList.push(comp.parent);
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#subManager.emitToast({ message: "Error while adding custom-component. Could not find name: " + name + "!", name: "" }, "error");
            console.error("Error while adding custom-component. Could not find name: " + name + "!");
        }
    }

    /**
     * Removes a component from a screen based on the given name
     * @param name - the name of the component which should be removed
     */
    removeComponent(name:string) {
        if (this.#contentStore.getComponentByName(name)) {
            const comp = this.#contentStore.getComponentByName(name) as BaseComponent;
            this.#contentStore.removedCustomComponents.set(name, comp);
            const notifyList = new Array<string>();
            if (comp.parent) {
                notifyList.push(comp.parent);
            }
            notifyList.filter(this.#contentStore.onlyUniqueFilter).forEach(parentId => this.#subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
        else {
            this.#subManager.emitToast({ message: "Error while removing component. Could not find name: " + name + "!", name: "" }, "error");
            console.error("Error while removing component. Could not find name: " + name + "!");
        }
    }

    /**
     * Returns the data of the current user.
     */
    getUser() {
        return (this.#contentStore as ContentStore).currentUser;
    }

    addGlobalComponent(name:string, comp:ReactElement) {
        this.#contentStore.globalComponents.set(name, (props:any) => React.cloneElement(comp, props));
    }

    addCSSToHeadBefore(path:string) {
        let before = undefined
        for (let link of document.head.getElementsByTagName('link')) {
            if (link.href.includes("application.css")) {
                before = link;
            }
            else if (!before && link.href.includes("color-schemes")) {
                before = link;
            }
            else if (!before && link.href.includes("themes")) {
                before = link
            }
            else if (!before && link.href.includes("design")) {
                before = link;
            }
        }
        const link:HTMLLinkElement = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = path;
        
        if (before) {
            document.head.insertBefore(link, before);
        }
        else {
            document.head.appendChild(link);
        }
    }

    addCSSToHeadAfter(path:string) {
        const link:HTMLLinkElement = document.createElement('link');
        link.rel = 'stylesheet'; 
        link.type = 'text/css';
        link.href = path;
        if (this.#appSettings.appReady) {
            document.head.appendChild(link);
        }
        else {
            this.#appSettings.cssToAddWhenReady.push(link);
        }
    }
}
export default API