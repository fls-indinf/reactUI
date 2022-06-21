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

/** React imports */
import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Tree, TreeExpandedKeysType, TreeSelectionParams } from 'primereact/tree';
import * as _ from 'underscore'
import BaseComponent from "../../util/types/BaseComponent";
import { createFetchRequest, createSelectTreeRequest } from "../../factories/RequestFactory";
import TreePath from "../../model/TreePath";
import { showTopBar } from "../topbar/TopBar";
import { onFocusGained, onFocusLost } from "../../util/server-util/SendFocusRequests";
import TreeNode from "primereact/treenode";
import useComponentConstants from "../../hooks/components-hooks/useComponentConstants";
import useAllDataProviderData from "../../hooks/data-hooks/useAllDataProviderData";
import useAllRowSelect from "../../hooks/data-hooks/useAllRowSelect";
import useMouseListener from "../../hooks/event-hooks/useMouseListener";
import { getMetaData } from "../../util/data-util/GetMetaData";
import { getSelfJoinedRootReference } from "../../util/data-util/GetSelfJoinedRootReference";
import FetchResponse from "../../response/data/FetchResponse";
import REQUEST_KEYWORDS from "../../request/REQUEST_KEYWORDS";
import { SelectFilter } from "../../request/data/SelectRowRequest";
import { sendOnLoadCallback } from "../../util/server-util/SendOnLoadCallback";
import { parseMaxSize, parseMinSize, parsePrefSize } from "../../util/component-util/SizeUtil";
import usePopupMenu from "../../hooks/data-hooks/usePopupMenu";
import { checkComponentName } from "../../util/component-util/CheckComponentName";
import { concatClassnames } from "../../util/string-util/ConcatClassnames";

/** Interface for Tree */
export interface ITree extends BaseComponent {
    dataBooks: string[],
    detectEndNode: boolean
}

type TreeMap = Map<string, { [key: string]: number }>;

/**
 * Returns the referenced node based on the given path
 * @param path - the path
 * @returns the referenced node based on the given path
 */
function getNode(nodes: TreeNode[], path: TreePath) {
    let tempNode = nodes[path.get(0)];
    for (let i = 1; i < path.length(); i++) {
        tempNode = (tempNode?.children ?? [])[path.get(i)];
    }
    return tempNode
};

/**
 * This component displays a Tree based on server sent databooks
 * @param baseProps - Initial properties sent by the server for this component
 */
const UITree: FC<ITree> = (baseProps) => {
    /** Reference for the span that is wrapping the tree containing layout information */
    const treeWrapperRef = useRef<HTMLSpanElement>(null);

    /** Component constants */
    const [context, topbar, [props], layoutStyle] = useComponentConstants<ITree>(baseProps);

    /** Name of the screen */
    const screenName = context.contentStore.getScreenName(props.id, props.dataBooks[0]) as string;

    /** The data provided by the databooks */
    const providedData = useAllDataProviderData(screenName, props.dataBooks);

    /** The selected rows of each databook */
    const selectedRows = useAllRowSelect(screenName, props.dataBooks);

    /** 
     * A Map of the current state of every node with their respective referenced column, the nodes
     * The keys are the nodes saved as TreePath and the value is the parents primary key/referenced column
     */
    const treeData = useRef<TreeMap>(new Map());

    /** Current state of the node objects which are handled by PrimeReact to display in the Tree */
    const [nodes, setNodes] = useState<TreeNode[]>([]);

    /** State of the keys of the nodes which are expanded */
    const [expandedKeys, setExpandedKeys] = useState<TreeExpandedKeysType>({});

    /** State of the key of a single node that is selected */
    const [selectedKey, setSelectedKey] = useState<any>();

    const [isInitialized, setInitialized] = useState(false);

    /** Extracting onLoadCallback and id from baseProps */
    const { onLoadCallback, id } = baseProps;

    /** Hook for MouseListener */
    useMouseListener(props.name, treeWrapperRef.current ? treeWrapperRef.current : undefined, props.eventMouseClicked, props.eventMousePressed, props.eventMouseReleased);

    const { detectEndNode } = props;

    /** Helper Methods */

    /**
     * Returns true if the given databook is self-joined (references itself in masterReference) false if it isn't
     * @param dataBook - the databook to check
     * @returns true if the given databook is self-joined false if it isn't
     */
     const isSelfJoined = useCallback((dataBook:string) => {
        const metaData = getMetaData(screenName, dataBook, context.contentStore, undefined);
        if (metaData?.masterReference) {
            return metaData.masterReference.referencedDataBook === dataBook;
        } else {
            return false;
        }
    }, [
        context.contentStore, 
        screenName
    ]);

    /**
     * Returns the name of the databook of given level, if the level is too high,
     * an empty string is returned unless the last databook is self-joined,
     * then the self-joined databook is returned.
     * @param level - the level of depth
     * @returns the name of the databook of given level
     */
     const getDataBookName = useCallback((level:number) => {
        if (level < props.dataBooks.length) {
            return props.dataBooks[level]
        } else {
            const dataBook = props.dataBooks[props.dataBooks.length-1];
            return isSelfJoined(dataBook) ? dataBook : "";
        }
    }, [
        isSelfJoined, 
        props.dataBooks
    ]);

    /**
     * Returns the correct datarow based on the given path or an empty object if none was found
     * @param path - the wanted path/datarow
     * @param referencedRow - the referenced parent row of the wanted path/datarow
     * @returns the correct datarow based on the given path or an empty object if none was found
     */
     const getDataRow = useCallback((path:TreePath, referencedRow:any) => {
        const dataBookName = getDataBookName(path.length() - 1);
        const metaData = getMetaData(screenName, dataBookName, context.contentStore, undefined)
        const dataPage = providedData.get(dataBookName);
        if (dataPage) {
            if (path.length() === 1) {
                //if path length is 1 there is only a current in the dataprovider map except for self-joined
                //in that case the root reference (pks of parent with null) is chosen. path.getLast() because it
                //is the index of the saved row.
                return dataPage.get(
                    isSelfJoined(dataBookName) 
                        ? getSelfJoinedRootReference(metaData!.masterReference!.referencedColumnNames) 
                        : "current"
                )[path.getLast()];
            } else {
                //In the dataprovider map, the key to the datapage are the referenced columns and their value of the parent stringified.
                //So the parent row (referencedRow) gets stringified and the last of the path is used to get the correct row.
                return dataPage.get(JSON.stringify(referencedRow))[path.getLast()];
            }  
        }
        return {}
    }, [
        screenName,
        providedData, 
        getDataBookName
    ]);

    /**
     * Either sends a fetch to receive the next datarows and adds them to the parent node
     * or just adds the nodes to the parent nodes if the data is already fetched.
     * @param fetchObj - the datarow which childrens are to be fetched
     * @param nodeReference - the reference to the node to add the children
     */
    const getChildrenForDataRow = useCallback((fetchObj:any, nodeReference: TreeNode) => {
        if(!nodeReference) {
            return Promise.reject();
        }
        const tempTreeMap:Map<string, any> = new Map<string, any>();
        const parentPath = new TreePath(
            typeof nodeReference.key === "string" 
                ? JSON.parse(nodeReference.key) 
                : typeof nodeReference.key === "undefined" 
                    ? [] 
                    : [nodeReference.key]
        );
        const fetchDataPage = getDataBookName(parentPath.length());
        const metaData = getMetaData(screenName, fetchDataPage, context.contentStore, undefined);

        /**
         * Adds the child nodes to the referenced Node, if they aren't already added
         * also adds the child nodes to the treedata
         * @param builtData - the fetched data
         */
        const addNodesToParent = (builtData:any[]) => {
            nodeReference.leaf = builtData.length === 0;
            builtData.forEach((data, i) => {
                const childPath = parentPath.getChildPath(i);
                nodeReference.children = nodeReference.children ? nodeReference.children : [];
                if (!nodeReference.children.some((child:any) => child.key === childPath.toString())) {
                    nodeReference.children.push({
                        key: childPath.toString(),
                        label: data[metaData!.columnView_table_[0]],
                        leaf: childPath.length() === props.dataBooks.length
                    });
                }
                tempTreeMap.set(childPath.toString(), _.pick(data, metaData!.primaryKeyColumns || ["ID"]));            
            })
        }

        return new Promise<{ treeMap: TreeMap }>(async (resolve, reject) => {
            if (metaData?.masterReference !== undefined) {
                //picking out the referenced columns of the datarow
                const pkObj = _.pick(fetchObj, metaData.masterReference.referencedColumnNames);
                //stringify the pkObj to create the key for the datapages in dataprovider map
                const pkObjStringified = JSON.stringify(pkObj);
                if (fetchDataPage && !providedData.get(fetchDataPage).has(pkObjStringified)) {
                    const fetchReq = createFetchRequest();
                    fetchReq.dataProvider = fetchDataPage;
                    fetchReq.filter = {
                        columnNames: metaData.masterReference.columnNames,
                        values: Object.values(pkObj)
                    }
                    await showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, undefined, undefined, undefined, undefined, false)
                        .then((fetchResponse:FetchResponse[]) => {
                            const builtData = context.server.buildDatasets(fetchResponse[0]);
                            context.server.processFetch(fetchResponse[0], pkObjStringified);
                            addNodesToParent(builtData);
                        }), topbar)
                } else {
                    //the data is already fetched so don't send a fetch and get the data by pkObjStringified
                    const builtData = providedData.get(fetchDataPage).get(pkObjStringified);
                    addNodesToParent(builtData);
                }
                resolve({treeMap: tempTreeMap})
            } else {
                reject()
            }
        })
    }, [
        context.contentStore, 
        context.server, 
        screenName, 
        getDataBookName, 
        props.dataBooks.length, 
        providedData
    ]);

    /**
     * This event is called when a node is selected, it builds the select tree request and sends it to the server
     * @param event 
     */
    const handleRowSelection = (event:TreeSelectionParams) => {
        if (event.value && typeof event.value === "string") {
            const selectedFilters:Array<SelectFilter|null> = []
            const selectedDatabooks = props.dataBooks;
            let path = new TreePath(JSON.parse(event.value));
            //filters are build parth upwards
            while (path.length()) {
                const dataBook = getDataBookName(path.length() -1)
                const dataRow = getDataRow(path, treeData.current.get(path.getParentPath().toString()));
                const primaryKeys = getMetaData(screenName, dataBook, context.contentStore, undefined)?.primaryKeyColumns || ["ID"];
                selectedFilters.push({
                    columnNames: primaryKeys,
                    values: primaryKeys.map((pk: string) => dataRow[pk])
                });
                path = path.getParentPath();
            }
            //array needs to be reversed so server can process them
            selectedFilters.reverse();

            //for databooks below, which are not selected/deselected add null to the filters
            while (selectedFilters.length < selectedDatabooks.length) {
                selectedFilters.push(null)
            }
            //If the databook is self-joined fill the array with its name
            while (selectedDatabooks.length < selectedFilters.length && isSelfJoined(selectedDatabooks.slice(-1).pop() as string)) {
                selectedDatabooks.push(selectedDatabooks.slice(-1).pop() as string)
            }
            const selectReq = createSelectTreeRequest();
            selectReq.componentId = props.name;
            selectReq.dataProvider = props.dataBooks
            selectReq.filter = selectedFilters;
            showTopBar(context.server.sendRequest(selectReq, REQUEST_KEYWORDS.SELECT_TREE), topbar);
        }
    }

    /** The component reports its preferred-, minimum-, maximum and measured-size to the layout */
    useLayoutEffect(() => {
        const wrapperRef = treeWrapperRef.current;
        if (wrapperRef) {
            sendOnLoadCallback(
                id, 
                props.className, 
                parsePrefSize(props.preferredSize), 
                parseMaxSize(props.maximumSize), 
                parseMinSize(props.minimumSize), 
                wrapperRef, 
                onLoadCallback
            )
        }
    }, [
        onLoadCallback, 
        id, 
        props.preferredSize, 
        props.maximumSize, 
        props.minimumSize,
        props.className
    ]);

    /**
     * Subscribes to TreeChange, when triggered, states are reset so the Tree can rebuild itself
     * as it is initializing.
     * @returns unsubscribing from TreeChange
     */
    useEffect(() => {
        const updateRebuildTree = () => {
            setExpandedKeys(prevKeys => ({...prevKeys}));
        }

        context.subscriptions.subscribeToTreeChange(props.dataBooks[0], updateRebuildTree);
        return () => context.subscriptions.unsubscribeFromTreeChange(props.dataBooks[0], updateRebuildTree);
    }, [
        context.subscriptions, 
        props.dataBooks
    ]);

    /**
     * Inits the tree: gets the data of the first level and adds them to nodes
     * calls fetches if necessary and sets the treedata
     */
    useEffect(() => {
        const firstLvlDataBook = props.dataBooks[0];
        const metaData = getMetaData(screenName, firstLvlDataBook, context.contentStore, undefined);

        let tempTreeMap = treeData.current;

        /**
         * When the first databook is self-joined, the root page must be fetched always.
         * Sets self-joined "null" datapage in dataprovider map
         * @returns the datarows of the root page
         */
        const fetchSelfJoinedRoot = async () => {
            const fetchReq = createFetchRequest();
            fetchReq.dataProvider = firstLvlDataBook;
            fetchReq.filter = {
                columnNames: metaData!.masterReference!.referencedColumnNames,
                values: [null]
            }
            const fetchResponse = await showTopBar(context.server.sendRequest(fetchReq, REQUEST_KEYWORDS.FETCH, undefined, undefined, undefined, undefined, false), topbar)
            context.server.processFetch(fetchResponse[0], getSelfJoinedRootReference(metaData!.masterReference!.referencedColumnNames));
            const builtData = context.server.buildDatasets(fetchResponse[0])
            return builtData;
        }

        const buildNodes = async (data:any[] = []) => {
            const newNodes = [...nodes];
            await Promise.allSettled(data.map(async (dataRow, i) => {
                const path = new TreePath(i);
                const addedNode: TreeNode = {
                    key: path.toString(),
                    label: dataRow[metaData!.columnView_table_[0]],
                    leaf: detectEndNode !== false
                };

                newNodes[i] = addedNode;

                if (detectEndNode !== false) {
                    await getChildrenForDataRow(dataRow, addedNode).then((res: any) => {
                        tempTreeMap = new Map([...tempTreeMap, ...res.treeMap])
                    });
                }

                tempTreeMap.set(path.toString(), _.pick(dataRow, metaData!.primaryKeyColumns || ["ID"]));
            }));
            treeData.current = new Map([...treeData.current, ...tempTreeMap])
            setNodes(newNodes);
            setInitialized(true);
        }

        //if the first databook is self-joined fetch the root page else fetch build up the tree as usual
        if (isSelfJoined(firstLvlDataBook)) {
            fetchSelfJoinedRoot().then((res:any) => buildNodes(res))   
        } else {
            buildNodes(providedData?.get(firstLvlDataBook)?.get("current"))
        }
        
    }, [ providedData.size ]);

    /**
     * Check if we have all the data for the tree we need if the expanded keys change
     */
     useEffect(() => {        
        async function growTree(){
            const newNodes = [...nodes];
            let tempTreeData = new Map(treeData.current);
            for (let key of Object.keys(expandedKeys).filter(k => expandedKeys[k])) {
                const path = new TreePath(JSON.parse(key));
                const node = getNode(newNodes, path);
                if (node) {
                    if (detectEndNode !== false) {
                        //Only fetch if there is another databook underneath
                        if (getDataBookName(path.length() + 1)) {
                            const dataRowChildren:any[] = providedData.get(getDataBookName(path.length())).get(JSON.stringify(treeData.current.get(key)));
                            if(dataRowChildren) {
                                await Promise.allSettled(dataRowChildren.map((data, i) => 
                                    getChildrenForDataRow(data, (node.children ?? [])[i])
                                        .then((res:any) => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
                                ))
                                .then(() => treeData.current = new Map([...treeData.current, ...tempTreeData]));
                            }
                        }
                    } else {
                        await getChildrenForDataRow(getDataRow(path, tempTreeData.get(path.getParentPath().toString())), node)
                            .then(res => tempTreeData = new Map([...tempTreeData, ...res.treeMap]))
                        treeData.current = new Map([...treeData.current, ...tempTreeData])
                    }
                }
            }
            setNodes(newNodes);
        }
        if(isInitialized) growTree();
    }, [ expandedKeys, isInitialized ]);

    /**
     * If the selectedRows change, generate the tree selectedKey and expandedKey
     */
    useEffect(() => {
        const selected = selectedRows.get(props.dataBooks[0]);
        if (selected) {
            let treePath: TreePath;
            if (isSelfJoined(props.dataBooks[0])) {
                treePath = new TreePath([...(selected.treePath?.toArray() ?? []), selected.index]);
            } else {
                treePath = new TreePath(props.dataBooks.map(db => selectedRows.get(db)?.index ?? -1).filter(v => v > -1));
            }

            setSelectedKey(treePath.toString());
            setExpandedKeys(prevState => {
                const newState = ({...prevState, ...treePath.toArray().slice(0, -1).reduce((a, n, i, arr) => ({...a, [`[${arr.slice(0, i + 1).join(',')}]`]: true}) , {})});
                return JSON.stringify(prevState) === JSON.stringify(newState) ? prevState : newState;
            });
            
        }
    }, [selectedRows]);

    const focused = useRef<boolean>(false);

    return (
        <span 
            ref={treeWrapperRef} 
            style={layoutStyle}
            tabIndex={props.tabIndex ? props.tabIndex : 0}
            onFocus={() => {
                if (!focused.current) {
                    if (props.eventFocusGained) {
                        onFocusGained(props.name, context.server);
                    }
                    focused.current = true;
                }
            }}
            onBlur={event => {
                if (treeWrapperRef.current && !treeWrapperRef.current.contains(event.relatedTarget as Node)) {
                    if (props.eventFocusLost) {
                        onFocusLost(props.name, context.server);
                    }
                    focused.current = false;
                }
            }}
            {...usePopupMenu(props)}
        >  
            <Tree
                id={checkComponentName(props.name)}
                className={concatClassnames("rc-tree", props.style)}
                value={nodes}
                selectionMode="single"
                selectionKeys={selectedKey}
                expandedKeys={expandedKeys}
                onToggle={e => setExpandedKeys(e.value)}
                onSelectionChange={handleRowSelection}
            />
        </span>
    )
}
export default UITree