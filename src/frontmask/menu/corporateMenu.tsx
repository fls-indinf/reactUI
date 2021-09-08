/** React imports */
import React, { FC, useCallback, useContext, useEffect, useState } from "react";

/** 3rd Party imports */
import { Menubar } from 'primereact/menubar';
import { SpeedDial } from "primereact/speeddial";
import { Tooltip } from 'primereact/tooltip'
import { MenuItem } from "primereact/menuitem";

/** Hook imports */
import { useDeviceStatus, useMenuItems } from "../../main/components/zhooks";

/** Other imports */
import { appContext } from "../../main/AppProvider";
import { IMenu, ProfileMenu } from "./menu";
import { BaseMenuButton } from "../../main/response";
import { parseIconData } from "../../main/components/compprops";
import { showTopBar, TopBarContext } from "../../main/components/topbar/TopBar";



const CorporateMenu:FC<IMenu> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    /** Current state of screen title, displays the screen title */
    const [screenTitle, setScreenTitle] = useState<string>("");

    /** get menu items */
    const menuItems = useMenuItems();

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    const handleNewToolbarItems = useCallback((toolbarItems: Array<MenuItem>) => {
        const tbItems = new Array<MenuItem>();
        toolbarItems.forEach(item => {
            const iconData = parseIconData(undefined, item.image)
            const toolbarItem:MenuItem = {
                label: item.text,
                icon: iconData.icon,
                command: () => showTopBar(item.action(), topbar)
            }
            tbItems.push(toolbarItem);
        });
        return tbItems
    }, [topbar])

    /** State of the toolbar-items */
    const [toolbarItems, setToolbarItems] = useState<Array<MenuItem>>(handleNewToolbarItems(context.contentStore.toolbarItems));

    /** 
     * The corporate-menu subscribes to the screen name and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToScreenName('c-menu', (appName: string) => setScreenTitle(appName));
        context.subscriptions.subscribeToToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));

        return () => {
            context.subscriptions.unsubscribeFromScreenName('c-menu');
            context.subscriptions.unsubscribeFromToolBarItems((toolBarItems:Array<BaseMenuButton>) => setToolbarItems(handleNewToolbarItems(toolBarItems)));
        }
    }, [context.subscriptions]);

    return (
        <div className="c-menu">
            <div className="c-menu-topbar">
                <div className="c-menu-header">
                    <div className="c-menu-logo-wrapper">
                        <img
                            className="menu-logo"
                            draggable="false"
                            src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG} alt="logo" />
                    </div>
                    <span className="menu-screen-title">{screenTitle}</span>
                    <div className="c-menu-profile">
                        <ProfileMenu showButtons visibleButtons={props.visibleButtons} />
                    </div>
                </div>
                {props.menuVisibility.menuBar &&
                    <div className="c-menu-menubar">
                        {props.menuVisibility.toolBar && toolbarItems && toolbarItems.length > 0 &&
                            <div style={{ maxHeight: "32px", minWidth: "32px" }}>
                                <Tooltip target=".p-speeddial-linear .p-speeddial-action" position="right"/>
                                <SpeedDial model={toolbarItems} direction="down" />
                            </div>
                        }
                        <Menubar model={menuItems} />
                    </div>
                }
            </div>
        </div>
    )
}
export default CorporateMenu