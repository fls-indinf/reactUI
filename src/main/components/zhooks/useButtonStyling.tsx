import { CSSProperties, useContext, useMemo } from "react";
import { appContext } from "../../AppProvider";
import { IButton } from "../buttons";
import COMPONENT_CLASSNAMES from "../COMPONENT_CLASSNAMES";
import { getAlignments, getMargins, IconProps, parseIconData } from "../compprops";

interface IButtonStyle {
    style: CSSProperties,
    iconProps: IconProps,
    iconPos: "left" | "right",
    iconCenterGap: number,
    iconGapPos: "left" | "right" | "top" | "bottom",
    borderPainted: boolean,
    tabIndex: number,
    iconDirection: "icon-center-left" | "icon-center-right" | "",
    pressedIconProps: IconProps | undefined,
    mouseOverIconProps: IconProps | undefined
}

/**
 * This hook returns style properties used by all button components
 * @param props - the properties of the button
 * @param layoutStyle - the layoutstyle of the button
 * @param ref - an element reference to center the button content
 * @param ref2 - an extra element reference to center button content, needed for checkbox and radiobutton
 * @returns style properties used by all button components
 */
const useButtonStyling = (props: IButton, layoutStyle?: CSSProperties, compStyle?: CSSProperties, ref?: HTMLElement, ref2?: HTMLElement): IButtonStyle => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** The margins of a button */
    const margins = useMemo(() => getMargins(props.margins), [props.margins]);

    /** Various style properties which are set by the properties received from the server */
    const buttonStyle: CSSProperties = useMemo(() => {
        let btnBackground = compStyle?.background ? compStyle.background as string : undefined;
        let btnJustify = props.horizontalTextPosition !== 1 ? getAlignments(props).ha : getAlignments(props).va;
        let btnAlign = props.horizontalTextPosition !== 1 ? getAlignments(props).va : getAlignments(props).ha;

        if (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON) {
            if (!btnBackground) {
                btnBackground = "transparent"
            }

            if (!btnJustify) {
                btnJustify = props.horizontalTextPosition !== 1 ? 'flex-start' : 'center';
            }

            if (!btnAlign) {
                btnAlign = props.horizontalTextPosition !== 1 ? 'center' : 'flex-start';
            }
        }
        else {
            if (!btnBackground) {
                btnBackground = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
            }

            if (!btnJustify) {
                btnJustify = "center";
            }

            if (!btnAlign) {
                btnAlign = "center";
            }
        }

        return {
            ...compStyle,
            background: btnBackground,
            borderColor: btnBackground,
            flexDirection: props.horizontalTextPosition === 1 ? "column" : undefined,
            justifyContent: btnJustify,
            alignItems: btnAlign,
            padding: margins ? margins.marginTop + 'px ' + margins.marginRight + 'px ' + margins.marginBottom + 'px ' + margins.marginLeft + 'px' : undefined,
        }
    }, [compStyle, props.horizontalTextPosition, margins]);

    /** The image property parsed as usable icon props */
    const iconProps = useMemo(() => parseIconData(compStyle?.color as string, props.image), [compStyle?.color, props.image]);

    /** The position of the icon */
    const iconPos = useMemo(() => {
        if (props.horizontalTextPosition === 0 || (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0)) {
            return "right"
        }
        return "left"
    }, [props.horizontalTextPosition, props.verticalTextPosition]);

    /** Centering the contents of a button (icon, text) */
    const iconCenterGap = useMemo(() => {
        if (props.className === COMPONENT_CLASSNAMES.CHECKBOX || props.className === COMPONENT_CLASSNAMES.RADIOBUTTON) {
            if (ref && ref2) {
                return ref.offsetWidth / 2 - ref2.offsetWidth / 2
            }
        }
        else {
            if (ref) {
                return (ref.children[1] as HTMLElement).offsetWidth / 2 - (iconProps.size?.width ? iconProps.size?.width / 2 : (ref.children[0] as HTMLElement).offsetWidth / 2);
            }
        }
        return 0;
    }, [layoutStyle?.width, layoutStyle?.height]);

    /** Where the icon gap is supposed to be */
    const iconGapPos = useMemo(() => {
        if (props.horizontalTextPosition === undefined) {
            return "right";
        }
        else if (props.horizontalTextPosition === 1 && (props.verticalTextPosition === 2 || props.verticalTextPosition === undefined)) {
            return "bottom";
        }
        else if (props.horizontalTextPosition === 1 && props.verticalTextPosition === 0) {
            return "top";
        }
        else if (props.horizontalTextPosition === 0) {
            return "left";
        }
        return "left"
    }, [props.horizontalTextPosition, props.verticalTextPosition]);

    /** If the icon is left or right of the center */
    const iconDirection = useMemo(() => {
        if (props.horizontalTextPosition === 1) {
            if (!props.horizontalAlignment) {
                return "icon-center-left";
            }
            else if (props.horizontalAlignment) {
                return 'icon-center-right';
            }
        }
        return "";
    }, [props.horizontalTextPosition, props.horizontalAlignment])

    /** True, if the border is painted */
    const borderPainted = useMemo(() => props.borderPainted !== false ? true : false, [props.borderPainted]);

    /** Tabindex value of the button */
    const tabIndex = useMemo(() => props.focusable !== false ? (props.tabIndex ? props.tabIndex : 0) : -1, [props.focusable, props.tabIndex]);

    /** The parsed icon properties of the icon which is displayed when pressing the button */
    const pressedIconData = useMemo(() => parseIconData(compStyle?.color as string, props.mousePressedImage), [compStyle?.color, props.mousePressedImage]);

    /** The parsed icon properties of the icon which is displayed when hovering the mouse over the button */
    const mouseOverIconData = useMemo(() => parseIconData(compStyle?.color as string, props.mouseOverImage), [compStyle?.color, props.mouseOverImage]);

    return {
        style: buttonStyle,
        iconProps: iconProps,
        iconPos: iconPos,
        iconCenterGap: iconCenterGap,
        iconGapPos: iconGapPos,
        iconDirection: iconDirection,
        borderPainted: borderPainted,
        tabIndex: tabIndex,
        pressedIconProps: pressedIconData,
        mouseOverIconProps: mouseOverIconData
    }
}
export default useButtonStyling