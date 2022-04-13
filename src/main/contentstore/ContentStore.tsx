import React, { ReactElement } from "react";
import { SubscriptionManager } from "../SubscriptionManager";
import { ServerMenuButtons, BaseMenuButton } from "../response";
import BaseComponent from "../util/types/BaseComponent";
import UserData from "../model/UserData";
import { IPanel } from '../components/panels'
import { ScreenWrapperOptions } from "../util/types/custom-types";
import { History } from "history";
import { IToolBarPanel } from "../components/panels/toolbarPanel/UIToolBarPanel";
import COMPONENT_CLASSNAMES from "../components/COMPONENT_CLASSNAMES";
import BaseContentStore, { ActiveScreen } from "./BaseContentStore";

/** The ContentStore stores active content like user, components and data*/
export default class ContentStore extends BaseContentStore {
    /** subscriptionManager instance */
    subManager: SubscriptionManager = new SubscriptionManager(this);

    menuItems = new Map<string, Array<ServerMenuButtons>>();

    /** The toolbar-entries sent by the server */
    toolbarItems = Array<BaseMenuButton>();

    /** The current logged in user */
    currentUser: UserData = new UserData();

    /** A Map which stores a workscreens nav-name as key and the componentId of the menu as value to open screens when navigating */
    navOpenScreenMap = new Map<string, string>();

    dialogButtons:Array<string> = new Array<string>();

    constructor(history?:History<any>) {
        super(history)
    }

    /**
     * Sets the currently active screens or clears the array
     * @param screenInfo - the screen-info of the newly opened screen or nothing to clear active screens
     * @param popup - true, if the newly opened screen is a popup
     */
    setActiveScreen(screenInfo?:ActiveScreen, popup?:boolean) {
        if (screenInfo) {
            if (popup) {
                const popupScreen:ActiveScreen = {...screenInfo};
                popupScreen.popup = true 
                this.activeScreens.push(popupScreen);
            }
            else {
                if (this.activeScreens[0] && this.activeScreens[0].popup) {
                    this.activeScreens.unshift(screenInfo);
                }
                else {
                    this.activeScreens = [screenInfo];
                }
            }
        }
        else {
            this.activeScreens = [];
        }
        this.subManager.emitActiveScreens();
    }

    //Content

    /**
     * Updates a components properties when the server sends new properties
     * @param existingComp - the existing component already in contentstore
     * @param newComp - the new component of changedcomponents
     */
    updateExistingComponent(existingComp:BaseComponent|undefined, newComp:BaseComponent) {
        if (existingComp) {
            for (let newPropName in newComp) {
                // @ts-ignore
                existingComp[newPropName] = newComp[newPropName];

                if (existingComp.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    this.updateToolBarProperties(existingComp as IToolBarPanel, newComp as IToolBarPanel, newPropName);
                }
            }
        }
    }

    /**
     * Sets or updates flatContent, removedContent, replacedContent, updates properties and notifies subscriber
     * that either a popup should be displayed, properties changed, or their parent changed, based on server sent components
     * @param componentsToUpdate - an array of components sent by the server
     */
    updateContent(componentsToUpdate: Array<BaseComponent>) {
        /** An array of all parents which need to be notified */
        const notifyList = new Array<string>();
        /** 
         * Is the existing component if a component in the server sent components already exists in flatContent, replacedContent or
         * removedContent. Undefined if it is a new component
         */
        let existingComponent: BaseComponent | undefined;

        componentsToUpdate.forEach(newComponent => {
            /** Checks if the component is a custom component */
            const isCustom:boolean = this.customComponents.has(newComponent.name as string);
            existingComponent = this.getExistingComponent(newComponent.id);

            this.updateExistingComponent(existingComponent, newComponent);

            if (newComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL && !isCustom) {
                this.handleToolBarComponent(existingComponent as IToolBarPanel, newComponent as IToolBarPanel);
            }

            /** Cast newComponent as Panel */
            const newCompAsPanel = (newComponent as IPanel);
            
            if (existingComponent) {
                if (newComponent["~remove"] !== true) {
                    /** If the new component is in removedContent, either add it to flatContent or replacedContent if it is custom or not*/
                    if (this.isRemovedComponent(newComponent.id)) {
                        if (!isCustom) {
                            this.removedContent.delete(newComponent.id);
                            this.flatContent.set(newComponent.id, existingComponent);
                        }
                        else {
                            this.removedCustomComponents.delete(newComponent.id);
                            this.replacedContent.set(newComponent.id, existingComponent);
                        }
                    }
                }

                if (newComponent["~remove"]) {
                    if (!isCustom) {
                        this.flatContent.delete(newComponent.id);
                        this.removedContent.set(newComponent.id, existingComponent);
                    }
                    else {
                        this.replacedContent.delete(newComponent.id);
                        this.removedCustomComponents.set(newComponent.id, existingComponent);
                    }
                }

                if (newComponent["~destroy"]) {
                    this.flatContent.delete(newComponent.id);
                    this.removedContent.delete(newComponent.id);
                    this.removedCustomComponents.delete(newComponent.id);
                }
            }

            /** Add parent of newComponent to notifyList */
            if (
                newComponent.parent || 
                newComponent["~remove"] || 
                newComponent["~destroy"] || 
                newComponent.visible !== undefined || 
                newComponent.constraints
            ) {
                if (existingComponent) {
                    this.addToNotifyList(existingComponent, notifyList);
                }
                else if(newComponent.parent) {
                    this.addToNotifyList(newComponent, notifyList);
                }
            }

            if (!existingComponent) {
                if (!isCustom) {
                    this.flatContent.set(newComponent.id, newComponent);
                }
                else {
                    // Add the basic properties to the custom component
                    const newComp:BaseComponent = {
                        id: newComponent.id, 
                        parent: newComponent.parent, 
                        constraints: newComponent.constraints, 
                        name: newComponent.name,
                        preferredSize: newComponent.preferredSize, 
                        minimumSize: newComponent.minimumSize, 
                        maximumSize: newComponent.maximumSize,
                        className: ""
                    };
                    this.replacedContent.set(newComponent.id, newComp)
                }
            }
        });

        /** If the component already exists and it is subscribed to properties update the state */
        componentsToUpdate.forEach(newComponent => {
            existingComponent = this.getExistingComponent(newComponent.id)

            const updateFunction = this.subManager.propertiesSubscriber.get(newComponent.id);

            if (existingComponent) {
                if (existingComponent.className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                    const existingTbMain = this.flatContent.get(existingComponent.id + "-tbMain") || this.removedContent.get(existingComponent.id + "-tbMain");
                    const existingTbCenter = this.flatContent.get(existingComponent.id + "-tbCenter") || this.removedContent.get(existingComponent.id + "-tbCenter");
                    if (existingTbMain && existingTbCenter) {
                        const updateMain = this.subManager.propertiesSubscriber.get(existingTbMain.id);
                        const updateCenter = this.subManager.propertiesSubscriber.get(existingTbCenter.id);
                        if (updateMain && updateCenter) {
                            updateMain(existingTbMain);
                            updateCenter(existingTbCenter);
                        }
                    }
                }
                if (updateFunction) {
                    updateFunction(existingComponent);
                }
            }
        });
        /** Call the update function of the parentSubscribers */
        notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
    }



    /**
     * When a screen closes cleanUp the data for the window 
     * @param windowName - the name of the window to close
     */
    // closeScreen(windowName: string, opensAnother?:boolean, closeContent?:boolean) {
    //     super.closeScreen(windowName, opensAnother, closeContent);

    //     if (this.activeScreens.length) {
    //         this.subManager.emitSelectedMenuItem(this.activeScreens.slice(-1).pop()!.className as string);
    //     }
    //     else if (!opensAnother) {
    //         this.subManager.emitSelectedMenuItem("");
    //     }
    // }

    /** Resets the contentStore */
    reset(){
        super.reset()
        this.toolbarItems = [];
        this.menuItems.clear();
        this.toolbarItems = new Array<BaseMenuButton>();
        this.currentUser = new UserData();
    }

    /**
     * Returns all visible children of a parent, if tabsetpanel also return invisible
     * @param id - the id of the component
     */
    getChildren(id: string, className?: string): Map<string, BaseComponent> {
        const mergedContent = new Map([...this.flatContent, ...this.replacedContent]);
        const componentEntries = mergedContent.entries();
        let children = new Map<string, BaseComponent>();
        let entry = componentEntries.next();
        let parentId = id;

        if (className) {
            if (mergedContent.has(parentId) && className.includes("ToolBarHelper")) {
                parentId = mergedContent.get(parentId)!.parent as string
            }
        }

        while (!entry.done) {
            const value = entry.value[1];

            if (value.parent === parentId && !this.removedCustomComponents.has(value.name)) {
                if (parentId.includes("TP")) {
                    children.set(value.id, value);
                }
                else if (value.visible !== false) {
                    children.set(value.id, value);
                }
            }
            entry = componentEntries.next();
        }
        if (className) {
            if (className === COMPONENT_CLASSNAMES.TOOLBARPANEL) {
                children = new Map([...children].filter(entry => entry[0].includes("-tb")));
            }
            else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERMAIN) {
                children = new Map([...children].filter(entry => entry[1]["~additional"]));
            }
            else if (className === COMPONENT_CLASSNAMES.TOOLBARHELPERCENTER) {
                children = new Map([...children].filter(entry => !entry[1]["~additional"] && !entry[0].includes("-tb")));
            }
        }
        return children;
    }

    /**
     * Adds a menuItem to the contentStor
     * @param menuItem - the menuItem
     */
     addMenuItem(menuItem: ServerMenuButtons){
        const menuGroup = this.menuItems.get(menuItem.group);
        if(menuGroup) {
            menuGroup.push(menuItem);
        }
        else {
            this.menuItems.set(menuItem.group, [menuItem]);
        }
    }

    /**
     * Adds a toolbarItem to toolbarItems
     * @param toolbarItem - the toolbar-item
     */
    addToolbarItem(toolbarItem:BaseMenuButton) {
        if (!this.toolbarItems.some(item => item === toolbarItem)) {
            this.toolbarItems.push(toolbarItem);
        }
    }

    //Custom Screens

    /**
     * Registers a customScreen to the contentStore, which will create a menuButton, add the screen to the content and add a menuItem
     * @param title - the title of the customScreen
     * @param group - the menuGroup of the customScreen
     * @param customScreen - the function to build the component
     */
    registerCustomOfflineScreen(title: string, group: string, customScreen: ReactElement, icon?:string){
        const menuButton: ServerMenuButtons = {
            group: group,

            componentId: "",
            image: icon ? icon.substring(0,2) + " " + icon : "",
            text: title,
            action: () => {
                this.history?.push("/home/"+title);
                return Promise.resolve(true);
            }
        }

        //this.addCustomScreen(title, customScreen);
        this.addMenuItem(menuButton);
    }

    /**
     * Registers a replaceScreen to the replaceScreens
     * @param title - the title of the replaceScreen
     * @param replaceScreen - the replaceScreen
     */
    registerReplaceScreen(title: string, replaceScreen: ReactElement){
        this.replaceScreens.set(title, (x:any) => React.cloneElement(replaceScreen, x));
    }

    /**
     * Registers a customComponent to the customComponents
     * @param title - the title of the customComponent
     * @param customComp - the custom component
     */
    registerCustomComponent(title:string, customComp?:ReactElement) {
        if (customComp === undefined) {
            this.customComponents.set(title, () => null);
        }
        else {
            this.customComponents.set(title, () => customComp);
        }
        /** Notifies the parent that a custom component has replaced a server sent component */
        if (this.getComponentByName(title)) {
            const customComp = this.getComponentByName(title) as BaseComponent
            const notifyList = new Array<string>();
            if (customComp.parent)
                notifyList.push(customComp.parent);
            notifyList.filter(this.onlyUniqueFilter).forEach(parentId => this.subManager.parentSubscriber.get(parentId)?.apply(undefined, []));
        }
    }

    /**
     * Either sets or updates applicationParameters sent by the server, or deletes them if their value is null
     * @param property - the name of the property
     * @param value - the value of the property
     */
    handleCustomProperties(property:string, value:any) {
        const customPropValue = this.customProperties.get(property);
        if (customPropValue && value === null) {
            this.customProperties.delete(property);
        }
        else {
            this.customProperties.set(property, value);
        }
    }

    /**
     * Adds a screen-wrapper for screens
     * @param screenName - the screen/s in which the screen-wrapper should be displayed
     * @param wrapper - the name of the screen-wrapper component
     * @param pOptions - the options for the screen-wrapper component
     */
    registerScreenWrapper(screenName:string|string[], wrapper:ReactElement, pOptions?:ScreenWrapperOptions) {
        if (Array.isArray(screenName))
            screenName.forEach(name => this.screenWrappers.set(name, {wrapper: wrapper, options: pOptions ? pOptions : {global: true}}));
        else 
            this.screenWrappers.set(screenName, {wrapper: wrapper, options: pOptions ? pOptions : {global: true}});
    }
}