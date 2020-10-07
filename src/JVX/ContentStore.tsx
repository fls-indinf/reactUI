import MenuResponse from "./response/MenuResponse";
import {ReplaySubject} from "rxjs";
import MenuItemCustom from "../primeExtension/MenuItemCustom";
import BaseComponent from "./components/BaseComponent";
import UserData from "./model/UserData";
import MetaDataResponse from "./response/MetaDataResponse";

class ContentStore{

    menuSubject = new ReplaySubject<Array<MenuItemCustom>>(1);
    flatContent = new Map<string ,BaseComponent>();
    removedContent = new Map<string ,BaseComponent>();

    currentUser: UserData = new UserData();

    //Sub Maps
    propertiesSubscriber = new Map<string, Function>();
    parentSubscriber = new Map<string, Function>();
    rowSelectionSubscriber = new Map<string, Array<Function>>();
    dataChangeSubscriber = new Map<string, Array<Function>>();

    //DataProvider Maps
    dataProviderData = new Map<string, Array<any>>();
    dataProviderMetaData = new Map<string, MetaDataResponse>();
    dataProviderFetched = new Map<string, boolean>();
    dataProviderSelectedRow = new Map<string, any>();


    //Content
    updateContent(componentsToUpdate: Array<BaseComponent>){
        const notifyList = new Array<string>();
        //Update FlatContent
        componentsToUpdate.forEach(newComponent => {
            //Check if component was removed earlier, if yes then re-add it to flatContent
            let existingComponent = this.removedContent.get(newComponent.id);
            if(existingComponent){
                this.removedContent.delete(existingComponent.id);
                this.flatContent.set(existingComponent.id, existingComponent);
            }

            //Update existing component
            existingComponent = this.flatContent.get(newComponent.id);

            //Build Notify List
            if(newComponent.parent){
                notifyList.push(newComponent.parent);
                if(existingComponent){
                    notifyList.push(existingComponent.id);
                }
            }
            if(newComponent.visible !== undefined && existingComponent && existingComponent.parent){
                notifyList.push(existingComponent.parent)
            }

            if(existingComponent){
                if(newComponent["~destroy"]){
                    //Delete Component From flatContent
                    const componentToRemove = this.flatContent.get(newComponent.id);
                    if(componentToRemove) {
                        this.flatContent.delete(componentToRemove.id);
                    }
                }
                else if (newComponent["~remove"]){
                    //Move Component to removedContent
                    const componentToRemove = this.flatContent.get(newComponent.id);
                    if(componentToRemove) {
                        this.flatContent.delete(componentToRemove.id);
                        this.removedContent.set(componentToRemove.id, componentToRemove);
                    }
                }
                else {
                    //Update or set properties
                    for(let newPropName in newComponent){
                        // @ts-ignore
                        existingComponent[newPropName] = newComponent[newPropName]

                    }
                }
            }
            else {
                this.flatContent.set(newComponent.id, newComponent);
            }
        });

        //Properties
        componentsToUpdate.forEach(value => {
            const existingComp = this.flatContent.get(value.id);
            const updateFunction = this.propertiesSubscriber.get(value.id);
            if(existingComp && updateFunction){
                updateFunction(existingComp);
            }
        });

        //Parents
        notifyList.forEach(value => {
            this.parentSubscriber.get(value)?.apply(undefined, []);
        });


    }

    closeScreen(windowName: string){
        const deleteChildren = (parentId: string) => {
            const children = this.getChildren(parentId);

            children.forEach(child => {
                deleteChildren(child.id);
                this.flatContent.delete(child.id);
            });
        }

        const window = this.getWindow(windowName);
        if(window){
            deleteChildren(window.id);
            this.flatContent.delete(window.id);
        }
    }


    //Data Provider Management
    updateDataProviderData(dataProvider: string, newDataSet: Array<any>, to: number, from: number){
        const existingData = this.dataProviderData.get(dataProvider);
        if(existingData){
            let newDataSetIndex = 0;
            for(let i = to; i <= from; i++){
                existingData[i] = newDataSet[newDataSetIndex];
                newDataSetIndex++;
            }
        }
        else{
            this.dataProviderData.set(dataProvider, newDataSet);
        }

        this.dataChangeSubscriber.get(dataProvider)?.forEach(value => {
           value.apply(undefined, [from, to]);
        });
    }

    getData(dataProvider: string): Array<any>{
        const dataArray = this.dataProviderData.get(dataProvider);
        return  dataArray || []
    }

    setSelectedRow(dataProvider: string, dataRow: any){
        this.dataProviderSelectedRow.set(dataProvider, dataRow);
    }

    clearSelectedRow(dataProvider: string){
        this.dataProviderSelectedRow.delete(dataProvider);
    }

    clearDataFromProvider(dataProvider: string){
        this.dataProviderData.delete(dataProvider);
    }


    //Getters
    getWindow(windowName: string): BaseComponent | undefined{
        const componentEntries = this.flatContent.entries();

        let entry = componentEntries.next();
        while(!entry.done){
            if(entry.value[1].name === windowName){
                return entry.value[1];
            }
            entry = componentEntries.next();
        }
        return undefined;
    }

    getChildren(parentId: string): Array<BaseComponent>{
        const componentEntries = this.flatContent.entries();
        const children = new Array<BaseComponent>();

        let entry = componentEntries.next();
        while (!entry.done){
            if(entry.value[1].parent === parentId){
                children.push(entry.value[1]);
            }
            entry = componentEntries.next();
        }
        return children;
    }


    //Menu
    buildMenuBar(menuResponse: MenuResponse){
        let groupsString= Array<string>();
        let groups = Array<MenuItemCustom>();
        //Make out distinct groups
        menuResponse.items.forEach(parent => {
            if(groupsString.indexOf(parent.group) === -1) {
                groupsString.push(parent.group)
                groups.push({label: parent.group, items: Array<MenuItemCustom>(), icon: "pi pi-google"})
            }
        });
        //Add SubMenus to parents
        groups.forEach(parent => {
            menuResponse.items.forEach(subMenu => {
                if(parent.label===subMenu.group) {
                    const item:MenuItemCustom = {
                        label: subMenu.action.label,
                        componentId: subMenu.action.componentId
                    }

                    // @ts-ignore
                    parent.items.push(item);
                }
            });
        });
        this.menuSubject.next(groups);
    }


    //Subscription Management
    subscribeToPropChange(id: string, fn: Function){
        this.propertiesSubscriber.set(id, fn);
    }

    subscribeToParentChange(id: string, fn: Function){
        this.parentSubscriber.set(id, fn);
    }

    subscribeToRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.rowSelectionSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }

    subscribeToDataChange(dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(dataProvider);
        if(subscriber){
            subscriber.push(fn);
        } else {
            this.dataChangeSubscriber.set(dataProvider, new Array<Function>(fn));
        }
    }


    unsubscribeFromDataChange(dataProvider: string, fn: Function){
        const subscriber = this.dataChangeSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromRowSelection(dataProvider: string, fn: Function){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider)
        if(subscriber){
            subscriber.splice(subscriber.findIndex(value => value === fn),1);
        }
    }

    unsubscribeFromParentChange(id: string){
        this.parentSubscriber.delete(id);
    }

    unsubscribeFromPropChange(id: string){
        this.propertiesSubscriber.delete(id);
    }


    //Events
    emitRowSelect(dataProvider: string){
        const subscriber = this.rowSelectionSubscriber.get(dataProvider);
        const selectedRow = this.dataProviderSelectedRow.get(dataProvider);
        if(subscriber){
            subscriber.forEach(sub => {
                sub.apply(undefined, [selectedRow]);
            });
        }
    }
}
export default ContentStore