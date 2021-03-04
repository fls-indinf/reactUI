/** React imports */
import React, {Children, CSSProperties, FC, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from "react";

/** 3rd Party imports */
import * as _ from 'underscore'

/** UI imports */
import Menu from "./menu/menu";

/** Hook imports */
import useMenuCollapser from "../JVX/components/zhooks/useMenuCollapser";
import useResponsiveBreakpoints from "../JVX/components/zhooks/useResponsiveBreakpoints";

/** Other imports */
import ChildWithProps from "../JVX/components/util/ChildWithProps";
import REQUEST_ENDPOINTS from "../JVX/request/REQUEST_ENDPOINTS";
import {createDeviceStatusRequest} from "../JVX/factories/RequestFactory";
import {jvxContext} from "../JVX/jvxProvider";
import {LayoutContext} from "../JVX/LayoutContext";
import ScreenManager from "./ScreenManager";

interface IUIManager {
    screenId: string
}

/**
 * Main displaying component which holds the menu and the main screen element, manages resizing for layout recalculating
 * @param props - the children components
 */
const UIManager: FC<IUIManager> = (props) => {
    /** Reference for the screen-container */
    const sizeRef = useRef<any>(null);
    /** Reference for the menu component */
    const menuRef = useRef<any>(null);
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);
    /** Flag if the manu is collpased or expanded */
    const menuCollapsed = useMenuCollapser('reactUI');
    /** Current state of the size of the screen-container*/
    const [componentSize, setComponentSize] = useState(new Map<string, CSSProperties>());

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
    getMenuSizeArray(parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menuWidth')), 
    parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--menuCollapsedWidth'))), menuCollapsed);

    /** 
     * When the window resizes, the screen-container will measure itself and set its size, 
     * setting this size will recalculate the layouts
     */
    const doResize = useCallback(() => {
        if(sizeRef.current || document.querySelector('#workscreen')){
            const size = sizeRef.current ? sizeRef.current.getBoundingClientRect() : document.querySelector('#workscreen')!.getBoundingClientRect();
            const sizeMap = new Map<string, CSSProperties>();
            Children.forEach(props.children,child => {
                const childWithProps = (child as ChildWithProps);
                sizeMap.set(childWithProps.props.id, {width: size.width, height: size.height});
            });
            setComponentSize(sizeMap);
        }
    },[props.children])

    /** Using underscore throttle for throttling resize event */
    const handleResize = _.throttle(doResize, 23);

    /** Using underscore debounce to debounce sending the current devicestatus (screen-container height and width) to the server */
    const handleDeviceStatus = _.debounce(() => {
        const deviceStatusReq = createDeviceStatusRequest();
        if(sizeRef.current || document.querySelector('#workscreen')){
            const mainSize = sizeRef.current ? sizeRef.current.getBoundingClientRect() : document.querySelector('#workscreen')!.getBoundingClientRect();
            deviceStatusReq.screenHeight = mainSize.height;
            deviceStatusReq.screenWidth = mainSize.width;
            context.server.sendRequest(deviceStatusReq, REQUEST_ENDPOINTS.DEVICE_STATUS);
        }
    },150);

    /** Resizing when screens or menuSize changes, menuSize changes every 10 pixel resizing every 10 pixel for a smooth transition */
    useLayoutEffect(() => {
        console.log('resize')
        doResize();
    }, [props.children, doResize, menuSize])

    /** 
     * Resize event handling, resize measuring and adding disable overflow while resizing to disable flickering scrollbar 
     * @returns remove eventListeners
     */
    useEffect(() => {
        const currSizeRef = sizeRef.current ? sizeRef.current : document.querySelector('#workscreen');
        const resizeTimer = _.debounce(() => {
            if (currSizeRef)
                currSizeRef.classList.remove("transition-disable-overflow")
        },150);
        const resizeListenerCall = () => {
            if (currSizeRef)
                currSizeRef.classList.add("transition-disable-overflow");
            handleResize();
            resizeTimer();
        }
        window.addEventListener("resize", resizeListenerCall)
        window.addEventListener("resize", handleDeviceStatus);
        if (menuRef && currSizeRef) {
            menuRef.current.addEventListener("transitionstart", () => currSizeRef.classList.add('transition-disable-overflow'));
            menuRef.current.addEventListener("transitionend", () => {
                setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0)
                doResize();
            });
        }

        return () => {
            window.removeEventListener("resize", handleDeviceStatus);
            window.removeEventListener("resize", resizeListenerCall);
            if (currSizeRef) {
                currSizeRef.removeEventListener("transitionstart", () => currSizeRef.classList.add('transition-disable-overflow'));
                currSizeRef.removeEventListener("transitionend", () => {
                    setTimeout(() => currSizeRef.classList.remove('transition-disable-overflow'), 0);
                    doResize();
                });
            }

        }
    // eslint-disable-next-line
    },[]);

    /** At the first render or when a screen is changing, call notifyScreenNameChanged, that screenName gets updated */
    useEffect(() => {
        let screenTitle = context.server.APP_NAME;
        Children.forEach(props.children,child => {
            const childWithProps = (child as ChildWithProps);
            if (childWithProps && childWithProps.props && childWithProps.props.screen_title_)
                screenTitle = childWithProps.props.screen_title_;
        })      
        context.contentStore.notifyScreenNameChanged(screenTitle)
    }, [props.children, context.server.APP_NAME, context.contentStore]);

    return(
        <div className={"reactUI"}>
            <Menu forwardedRef={menuRef}/>
            <LayoutContext.Provider value={componentSize}>
                <div id="reactUI-main" className={"main" + ((menuCollapsed || (window.innerWidth <= 600 && context.contentStore.menuOverlaying)) ? " screen-expanded" : "")}>
                    <ScreenManager forwardedRef={sizeRef} />
                </div>
            </LayoutContext.Provider>
        </div>

    )
}
export default UIManager