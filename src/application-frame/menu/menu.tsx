import React, { FC, useCallback, useContext, useEffect, useRef, useState } from "react";
import { PanelMenu } from 'primereact/panelmenu';
import { Menubar } from 'primereact/menubar';
import { useHistory } from "react-router";
import { Button } from "primereact/button";
import { MenuItem } from "primereact/menuitem";
import { useMenuCollapser, useMenuItems, useProfileMenuItems, useEventHandler, useDeviceStatus, useScreenTitle, useConstants } from '../../main/components/zhooks'
import { appContext } from "../../main/AppProvider";
import { IForwardRef } from "../../main/IForwardRef";
import { concatClassnames } from "../../main/components/util";
import { createCloseScreenRequest, createReloadRequest, createRollbackRequest, createSaveRequest } from "../../main/factories/RequestFactory";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { MenuVisibility, VisibleButtons } from "../../main/AppSettings";
import { EmbeddedContext } from "../../MiddleMan";
import { ApplicationSettingsResponse } from "../../main/response";
import { REQUEST_KEYWORDS } from "../../main/request";


/** Extends the PrimeReact MenuItem with componentId */
export interface MenuItemCustom extends MenuItem {
    componentId:string
    screenClassName:string
}

/** Interface for menu */
export interface IMenu extends IForwardRef {
    showMenuMini?:boolean,
    menuVisibility:MenuVisibility,
}

/** Interface for profile-menu */
interface IProfileMenu {
    showButtons?: boolean,
    visibleButtons?: VisibleButtons
}

/**
 * Renders the profile-menu and also the buttons (home, save, reload) next to the profile-menu.
 * @param props - properties, if the buttons are visible
 */
export const ProfileMenu:FC<IProfileMenu> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    /** The profile-menu options */
    const profileMenu = useProfileMenuItems();

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    /** History of react-router-dom */
    const history = useHistory();

    // Subscribes to the menu-visibility and the visible-buttons displayed in the profile-menu
    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setVisibleButtons({
                reload: appSettings.reload,
                rollback: appSettings.rollback,
                save: appSettings.save
            });
        });

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setVisibleButtons({
                    reload: appSettings.reload,
                    rollback: appSettings.rollback,
                    save: appSettings.save
                });
            });
        }
    }, [context.subscriptions])
    
    return (
        <>
            {props.showButtons && <Button
                icon="fas fa-home"
                className="menu-topbar-buttons"
                onClick={() => {
                    //Either opens the basic "home" or a welcome screen if there is one.
                    const openWelcomeOrHome = () => {
                        if (context.appSettings.welcomeScreen) {
                            return context.api.sendOpenScreenRequest(context.appSettings.welcomeScreen);
                        }
                        else {
                            history.push('/home');
                            return Promise.resolve(true);
                        }
                    }

                    // If a screen is opened, close it, and redirect to home or welcome-screen
                    if (context.contentStore.activeScreens.length) {
                        context.subscriptions.emitSelectedMenuItem("");
                        if (!context.contentStore.customScreens.has(context.contentStore.activeScreens[0].name)) {
                            const screenName = context.contentStore.activeScreens[0].name;
                            const closeReq = createCloseScreenRequest();
                            closeReq.componentId = screenName;
                            context.contentStore.setActiveScreen();
                            showTopBar(context.server.sendRequest(closeReq, REQUEST_KEYWORDS.CLOSE_SCREEN), topbar).then((res) => {
                                if (res[0] === undefined || res[0].name !== "message.error") {
                                    context.server.lastClosedWasPopUp = false;
                                    context.contentStore.closeScreen(screenName, context.appSettings.welcomeScreen ? true : false);
                                    showTopBar(openWelcomeOrHome(), topbar);
                                }
                            });
                        }
                        else {
                            context.contentStore.setActiveScreen();
                            showTopBar(openWelcomeOrHome(), topbar);
                        }
                    }
                }}
                tooltip="Home"
                tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} />
            }
            {props.showButtons && (!visibleButtons || visibleButtons.save) && <Button
                icon="fas fa-save"
                className="menu-topbar-buttons"
                onClick={() => showTopBar(context.server.sendRequest(createSaveRequest(), REQUEST_KEYWORDS.SAVE), topbar)}
                tooltip={translations.get("Save")}
                tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} />}
            {(!visibleButtons || (visibleButtons.reload || visibleButtons.rollback) && props.showButtons) &&
                <Button
                    icon={!visibleButtons ? "fas fa-sync" : visibleButtons.reload && !visibleButtons.rollback ? "fas fa-sync" : "pi pi-undo"}
                    className="menu-topbar-buttons"
                    onClick={() => {
                        if (!visibleButtons || (visibleButtons.reload && !visibleButtons.rollback)) {
                            showTopBar(context.server.sendRequest(createReloadRequest(), REQUEST_KEYWORDS.RELOAD), topbar)
                        }
                        else {
                            showTopBar(context.server.sendRequest(createRollbackRequest(), REQUEST_KEYWORDS.ROLLBACK), topbar)
                        }
                    }}
                    tooltip={translations.get(!visibleButtons ? "Reload" : visibleButtons.reload && !visibleButtons.rollback ? "Reload" : "Rollback")}
                    tooltipOptions={{ style: { opacity: "0.85" }, position:"bottom", mouseTrack: true, mouseTrackTop: 30 }} /> }
            <div className="profile-menu">
                <Menubar
                    style={context.contentStore.currentUser.profileImage ? { "--profileImage": `url(data:image/jpeg;base64,${context.contentStore.currentUser.profileImage})` } : {}}
                    model={profileMenu} />
            </div>
        </>
    )
}

/**
 * Menu component builds and displays the menu for reactUI, consists of a topbar with a profile-menu and a sidebar with panel-menu.
 * @param props - the properties the menu receives from the UIManager.
 */
const Menu: FC<IMenu> = (props) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** True, if the application is embedded, then don't display the menu */
    const embeddedContext = useContext(EmbeddedContext);

    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('menu');

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    /** Current state of screen title, displays the screen title */
    const screenTitle = useScreenTitle();

    /** Reference for logo container element*/
    const menuLogoRef = useRef<HTMLDivElement>(null);

    /** Reference for logo container when devicemode is mini */
    const menuLogoMiniRef = useRef<HTMLDivElement>(null);

    /** Reference for fadeout element when menu is collapsed */
    const fadeRef = useRef<HTMLDivElement>(null);

    /** a reference to the current panelmenu reactelement */
    const panelMenu = useRef<PanelMenu>(null);

    /** The currently selected-menuitem */
    const [selectedMenuItem, setSelectedMenuItem] = useState<string>(context.contentStore.selectedMenuItem);

    /** get menu items */
    const menuItems = useMenuItems()

    /**
     * Triggers a click on an opened menu panel to close it, 
     * when hovering out of expanded menu, closing expanded menu, collapsing menu etc.
     */
    const closeOpenedMenuPanel = useCallback(() => {
        if (props.menuVisibility.menuBar) {
            if (props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link') !== null) {
                props.forwardedRef.current.scrollTop = 0;
                props.forwardedRef.current.querySelector('.p-highlight > .p-panelmenu-header-link').click();
            }
        }
    },[props.forwardedRef])

    /** 
     * The standard-menu subscribes to the screen name, selectedMenuItem and app-settings, so everytime these properties change the state
     * will get updated.
     *  @returns unsubscribing from the screen name on unmounting
     */
    useEffect(() => {
        context.subscriptions.subscribeToSelectedMenuItem((menuItem: string) => setSelectedMenuItem(menuItem));

        return () => context.subscriptions.unsubscribeFromSelectedMenuItem();
    }, [context.subscriptions]);

    /** Handling if menu is collapsed or expanded based on windowsize */
    useEffect(() => {
        if (props.menuVisibility.menuBar) {
            if (!context.appSettings.menuModeAuto) {
                context.appSettings.setMenuModeAuto(true)
            }
            else {
                if (deviceStatus === "Small" || deviceStatus === "Mini") {
                    closeOpenedMenuPanel();
                    context.subscriptions.emitMenuCollapse(0);
                }
                else {
                    context.subscriptions.emitMenuCollapse(1);
                }
            }
        }
    }, [context.contentStore, context.subscriptions, deviceStatus])

    useEffect(() => {
        if (props.menuVisibility.menuBar) {
            if (menuItems) {
                let foundMenuItem:MenuItem = {}
                menuItems.forEach(m => {
                    if ((m.items as MenuItem[]).find((item) => (item as MenuItemCustom).screenClassName === selectedMenuItem)) {
                        foundMenuItem = m
                    }
                });
    
                if (foundMenuItem && !panelMenu.current?.state.activeItem) {
                    panelMenu.current?.setState({ activeItem: foundMenuItem });
                }
                else if ((foundMenuItem && panelMenu.current?.state.activeItem) && foundMenuItem.label && foundMenuItem.label !== panelMenu.current.state.activeItem.label) {
                    panelMenu.current?.setState({ activeItem: foundMenuItem });
                }
            }
        }

    }, [selectedMenuItem, menuItems])

    //First delete every p-menuitem--active className and then add it to the selected menu-item when the active item changes.
    useEffect(() => {
        if (props.menuVisibility.menuBar) {
            Array.from(document.getElementsByClassName("p-menuitem--active")).forEach(elem => elem.classList.remove("p-menuitem--active"));
            const menuElem = document.getElementsByClassName(selectedMenuItem)[0];
            if (menuElem) {
                menuElem.classList.add("p-menuitem--active");
            } 
        }
    },[selectedMenuItem])

    /**
     * Adds eventlisteners for mouse hovering and mouse leaving. When the menu is collapsed and the mouse is hovered,
     * the menu expands, the logo switches to the big logo and fadeout div display is set to none. On leaving menu 
     * collapses, logo is small and fadeout is displayed.
     * @returns removing eventlisteners on unmount
     */
    useEffect(() => {
        if (props.menuVisibility.menuBar) {
            const menuOuter = document.getElementsByClassName("std-menu")[0] as HTMLElement;
            if (props.forwardedRef.current) {
                const menuRef = props.forwardedRef.current;
                const hoverExpand = () => {
                    if (menuOuter.classList.contains("menu-collapsed")) {
                        menuOuter.classList.remove("menu-collapsed");
                        if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                            (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                            (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_BIG;
                            fadeRef.current.style.setProperty('display', 'none');
                        }
                    }
                }
                const hoverCollapse = () => {
                    if (!menuOuter.classList.contains("menu-collapsed")) {
                        menuOuter.classList.add("menu-collapsed");
                        if (menuLogoRef.current && fadeRef.current && menuLogoMiniRef.current) {
                            (menuLogoRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
                            (menuLogoMiniRef.current.children[0] as HTMLImageElement).src = (process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_SMALL;
                            fadeRef.current.style.removeProperty('display');
                        }
                        closeOpenedMenuPanel();
                    }
                }
        
                if (menuCollapsed) {
                    menuRef.addEventListener('mouseover', hoverExpand);
                    menuRef.addEventListener('mouseleave', hoverCollapse);
                }
                else {
                    menuRef.removeEventListener('mouseover', hoverExpand);
                    menuRef.removeEventListener('mouseleave', hoverCollapse);
                }
                return () => {
                    menuRef.removeEventListener('mouseover', hoverExpand);
                    menuRef.removeEventListener('mouseleave', hoverCollapse);
                }
            }
        }

    },[menuCollapsed, props.forwardedRef, context.appSettings.LOGO_BIG, context.appSettings.LOGO_SMALL, closeOpenedMenuPanel]);

    /** When the transition of the menu-opening starts, add the classname to the element so the text of active screen is blue */
    useEventHandler(document.getElementsByClassName("p-panelmenu")[0] as HTMLElement, "transitionstart", (event) => {
        if (props.menuVisibility.menuBar) {
            if ((event as any).propertyName === "max-height") {
                const menuElem = document.getElementsByClassName(selectedMenuItem)[0];
                if (menuElem && !menuElem.classList.contains("p-menuitem--active")) {
                    menuElem.classList.add("p-menuitem--active")
                }
            }
        }
    });

    /** 
     * Handles the click on the menu-toggler. It closes a currently opened panel and switches
     * menuModeAuto which means, if true the menu will collapse/expand based on window size if
     * false the menu will be locked in its position.
     * It also notifies the contentstore that the menu has been collapsed
     */
    const handleToggleClick = () => {
        if (props.menuVisibility.menuBar) {
            closeOpenedMenuPanel();
            context.appSettings.setMenuModeAuto(!context.appSettings.menuModeAuto)
            context.subscriptions.emitMenuCollapse(2);
        }
    }

    return (
        <>
            {(props.menuVisibility.menuBar && !embeddedContext) &&
                <div className={concatClassnames(
                    "std-menu",
                    menuCollapsed ? " menu-collapsed" : "",
                    props.showMenuMini ? "" : "no-mini"
                )}>
                    <div className={"menu-header"}>
                        <div className="menu-logo-wrapper" ref={menuLogoRef}>
                            <img draggable="false" className="menu-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                        </div>
                        <div className="menu-topbar">
                            <div className="menu-topbar-left">
                                <Button
                                    icon={!menuCollapsed ? "pi pi-chevron-left" : "pi pi-chevron-right"}
                                    className="menu-topbar-buttons menu-toggler"
                                    onClick={() => handleToggleClick()}
                                    style={{ marginRight: "4px", marginLeft: "10px" }} />
                                <span className="menu-screen-title">{screenTitle}</span>
                            </div>
                            <div className="menu-topbar-right">
                                <ProfileMenu showButtons />
                            </div>
                        </div>
                    </div>
                    {props.menuVisibility.menuBar &&
                        <div ref={props.forwardedRef} className="menu-panelmenu-wrapper">
                            <div className="menu-logo-mini-wrapper" ref={menuLogoMiniRef}>
                                <img className="menu-logo-mini" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + (menuCollapsed ? context.appSettings.LOGO_SMALL : context.appSettings.LOGO_BIG)} alt="logo" />
                            </div>
                            <PanelMenu model={menuItems} ref={panelMenu} />
                            {menuCollapsed && <div className="fadeout" ref={fadeRef}></div>}
                        </div>
                    }
                </div>
            }
        </>
    )
}
export default Menu;