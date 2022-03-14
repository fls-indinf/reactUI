import { useContext, useRef } from "react";
import { useEventHandler } from ".";
import { appContext } from "../../AppProvider";
import { createMouseClickedRequest, createMouseRequest } from "../../factories/RequestFactory";
import { REQUEST_ENDPOINTS } from "../../request";
import { showTopBar, TopBarContext } from "../topbar/TopBar";

/** Returns which mouse-button was pressed */
const getMouseButton = (button:number): "Left"|"Middle"|"Right" => {
    if (button === 0) {
        return "Left";
    }
    else if (button === 1) {
        return "Middle";
    }
    else {
        return "Right";
    }
}

/**
 * Adds mouse-listeners for the components
 * @param compName - the name of the component
 * @param element - the element which the handler is added to
 * @param eventMouseClicked - true if mouse clicked should be added
 * @param eventMousePressed - true if mouse pressed should be added
 * @param eventMouseReleased - true if mouse released should be added
 * @param hold - function on hold
 */
const useMouseListener = (
    compName:string, 
    element?:HTMLElement, 
    eventMouseClicked?:boolean, 
    eventMousePressed?:boolean, 
    eventMouseReleased?:boolean,
    hold?: (type: "pressed" | "released" | "clicked" | "cancelled", release: () => void) => void
) => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);

    const pressedElement = useRef<boolean>(false);

    const pressedX = useRef<number>();
    
    const pressedY = useRef<number>();

    const handleMousePressed = (event:MouseEvent) => {
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        pressedX.current = event.x;
        pressedY.current = event.y;
        pressedElement.current = true;

        if (eventMousePressed) {
            const pressReq = createMouseRequest();
            pressReq.componentId = compName;
            pressReq.button = getMouseButton(event.button);
            pressReq.x = event.x;
            pressReq.y = event.y;
            const release = () => showTopBar(context.server.sendRequest(pressReq, REQUEST_ENDPOINTS.MOUSE_PRESSED), topbar);
            hold ? hold("pressed", release) : release();
        }
    }

    const handleMouseUp = (event:MouseEvent) => {
        if ((event.target as HTMLElement).closest(".p-autocomplete-dropdown")) {
            event.stopPropagation();
        }

        if (eventMouseClicked && pressedX.current === event.x && pressedY.current === event.y) {
            const clickReq = createMouseClickedRequest();
            clickReq.componentId = compName;
            clickReq.button = getMouseButton(event.button);
            clickReq.x = event.x;
            clickReq.y = event.y;
            clickReq.clickCount = event.detail;
            const release = () => showTopBar(context.server.sendRequest(clickReq, REQUEST_ENDPOINTS.MOUSE_CLICKED), topbar);
            hold ? hold("clicked", release) : release();
        } else if (hold) {
            hold("cancelled", () => {});
        }

        if (eventMouseReleased && pressedElement.current) {
            const releaseReq = createMouseRequest();
            releaseReq.componentId = compName;
            releaseReq.button = getMouseButton(event.button);
            releaseReq.x = event.x;
            releaseReq.y = event.y;
            const release = () => showTopBar(context.server.sendRequest(releaseReq, REQUEST_ENDPOINTS.MOUSE_RELEASED), topbar);
            hold ? hold("released", release) : release();
        }

        pressedElement.current = false;
    }

    useEventHandler(element, "mousedown", (event) => handleMousePressed(event as MouseEvent));
    useEventHandler(document.body, "mouseup", (event) => handleMouseUp(event as MouseEvent));
}
export default useMouseListener;