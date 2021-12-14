/** React imports */
import React, { Children, createContext, FC, useContext, useEffect, useMemo, useRef, useState } from "react";

/** 3rd Party imports */
import * as _ from 'underscore'

/** UI imports */
import Menu from "./menu/menu";

/** Hook imports */
import { useMenuCollapser, useResponsiveBreakpoints, useDeviceStatus } from "../main/components/zhooks";

/** Other imports */
import { ChildWithProps, concatClassnames, getScreenIdFromNavigation } from "../main/components/util";
import { appContext } from "../main/AppProvider";
import ScreenManager from "./ScreenManager";
import ChangePasswordDialog from "./changePassword/ChangePasswordDialog";
import CorporateMenu from "./menu/corporateMenu";
import { MenuVisibility, VisibleButtons } from "../main/AppSettings";
import { ApplicationSettingsResponse } from "../main/response";
import { useParams } from "react-router";

export interface IUIManagerProps {
    customAppWrapper?: React.ComponentType,
}

export interface IResizeContext {
    menuSize?:number,
    menuRef?: any,
    login?:boolean,
    menuCollapsed?:boolean,
    mobileStandard?:boolean,
    setMobileStandard?: Function
}

export const ResizeContext = createContext<IResizeContext>({});

export function isCorporation(appLayout:string, theme:string) {
    if (appLayout === "corporation") {
        if (theme === "basti_mobile" && window.innerWidth <= 530) {
            return false;
        }
        return true;
    }
    return false;
}

/**
 * Main displaying component which holds the menu and the main screen element, manages resizing for layout recalculating
 * @param props - the children components
 */
const UIManager: FC<IUIManagerProps> = (props) => {
    /** Reference for the menu component */
    const menuRef = useRef<any>(null);

    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('reactUI');

    /** State of menu-visibility */
    const [menuVisibility, setMenuVisibility] = useState<MenuVisibility>(context.appSettings.menuVisibility);

    /** State of button-visibility */
    const [visibleButtons, setVisibleButtons] = useState<VisibleButtons>(context.appSettings.visibleButtons);

    /** True, if the session is expired */
    const [sessionExpired, setSessionExpired] = useState<boolean>(false);

    /** True, if the standard menu for mobile is active IF corporation applayout is set */
    const [mobileStandard, setMobileStandard] = useState<boolean>(false);

    /** True, if the menu should be shown in mini mode */
    const menuMini = false;

    /** The currently used app-layout */
    const appLayout = useMemo(() => context.appSettings.applicationMetaData.applicationLayout.layout, [context.appSettings.applicationMetaData]);

    /** ComponentId of Screen extracted by useParams hook */
    const { componentId } = useParams<any>();

    /** The current state of device-status */
    const deviceStatus = useDeviceStatus();

    const [appTheme, setAppTheme] = useState<string>(context.appSettings.applicationMetaData.applicationTheme.value);

    /**
     * Helper function for responsiveBreakpoints hook for menu-size breakpoint values
     * @param start - Biggest possible size of menu
     * @param end - Smallest possible size of menu
     * @returns an Array with 10 step values between start and end
     */
    const getMenuSizeArray = (start:number, end:number) => {
        const dataArray:number[] = []
        while (start >= end) {
            dataArray.push(start);
            start -= 10;
        }
        return dataArray;
    }

    /** Current state of menu size */
    const menuSize = useResponsiveBreakpoints(menuRef, 
    getMenuSizeArray(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--s-menu-width')),
    menuMini ? parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--s-menu-collapsed-width')) : 0), menuCollapsed);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings: ApplicationSettingsResponse) => {
            setMenuVisibility({
                menuBar: appSettings.menuBar,
                toolBar: appSettings.toolBar
            });

            setVisibleButtons({
                reload: appSettings.reload,
                rollback: appSettings.rollback,
                save: appSettings.save
            });
        });

        context.subscriptions.subscribeToErrorDialog((show:boolean) => setSessionExpired(show));

        context.subscriptions.subscribeToTheme("uimanager", (theme:string) => setAppTheme(theme));

        return () => {
            context.subscriptions.unsubscribeFromAppSettings((appSettings: ApplicationSettingsResponse) => {
                setMenuVisibility({
                    menuBar: appSettings.menuBar,
                    toolBar: appSettings.toolBar
                });

                setVisibleButtons({
                    reload: appSettings.reload,
                    rollback: appSettings.rollback,
                    save: appSettings.save
                });
            });
            context.subscriptions.unsubscribeFromErrorDialog((show:boolean) => setSessionExpired(show));
            context.subscriptions.unsubscribeFromTheme("uimanager");
        }
    }, [context.subscriptions])

    /** At the first render or when a screen is changing, call notifyScreenNameChanged, that screenName gets updated */
    useEffect(() => {
        let screenTitle = context.appSettings.applicationMetaData.applicationName;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })      
        context.subscriptions.notifyScreenTitleChanged(screenTitle)
    }, [props.children, context.subscriptions]);

    const CustomWrapper = props.customAppWrapper;

    return (
        (CustomWrapper) ?
            <div
                className={concatClassnames(
                    "reactUI",
                    isCorporation(appLayout, appTheme) ? "corporation" : "",
                    sessionExpired ? "reactUI-expired" : "",
                    appTheme
                )}>
                <ChangePasswordDialog loggedIn username={context.contentStore.currentUser.name} password="" />
                <CustomWrapper>
                    <div id="reactUI-main" className="main">
                        <ResizeContext.Provider value={{ login: false, menuRef: menuRef, menuSize: menuSize }}>
                            <ScreenManager />
                        </ResizeContext.Provider>
                    </div>
                </CustomWrapper>
            </div>
            : <div className={concatClassnames(
                "reactUI",
                isCorporation(appLayout, appTheme) ? "corporation" : "",
                sessionExpired ? "reactUI-expired" : "",
                appTheme
            )} >
                <ChangePasswordDialog loggedIn username={context.contentStore.currentUser.userName} password="" />
                {isCorporation(appLayout, appTheme) ?
                    <CorporateMenu
                        menuVisibility={menuVisibility}
                        visibleButtons={visibleButtons} />
                    :
                    <Menu
                        forwardedRef={menuRef}
                        showMenuMini={menuMini}
                        menuVisibility={menuVisibility}
                        visibleButtons={visibleButtons} />}
                <div id="reactUI-main" className={concatClassnames(
                    "main",
                    isCorporation(appLayout, appTheme) ? "main--with-c-menu" : "main--with-s-menu",
                    ((menuCollapsed || (["Small", "Mini"].indexOf(deviceStatus) !== -1 && context.appSettings.menuOverlaying)) && (appLayout === "standard" || appLayout === undefined || (appLayout === "corporation" && window.innerWidth <= 530))) ? " screen-expanded" : "",
                    menuMini ? "" : "screen-no-mini",
                    menuVisibility.toolBar ? "toolbar-visible" : "",
                    !menuVisibility.menuBar ? "menu-not-visible" : "",
                    !getScreenIdFromNavigation(componentId, context.contentStore) && context.appSettings.desktopPanel ? "desktop-panel-enabled" : "",
                )}>
                    <ResizeContext.Provider value={{ login: false, menuRef: menuRef, menuSize: menuSize, menuCollapsed: menuCollapsed, mobileStandard: mobileStandard, setMobileStandard: (active:boolean) => setMobileStandard(active) }}>
                        <ScreenManager />
                    </ResizeContext.Provider>
                </div>
            </div>
    )
}
export default UIManager