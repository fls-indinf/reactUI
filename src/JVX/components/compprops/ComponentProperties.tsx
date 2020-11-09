import tinycolor from 'tinycolor2';
import Margins from '../layouts/models/Margins';
import Size from '../util/Size';
import IconProps from './IconProps';
import { UIFont } from './UIFont';

export function getMargins(margins:string|Margins|undefined) {
    if (margins !== undefined)
        if (typeof margins === "string")
            return new Margins(margins.split(','));
        else
            return margins;
    else
        return undefined
}

export function getFont(font:string|UIFont|undefined) {
    if (font !== undefined) {
        if (typeof font === "string")
            return new UIFont(font.split(','));
        else
            return font;
    }
    else
        return undefined;
}

export function parseIconData(foreground:string|undefined, iconData:string|undefined): IconProps {
    if (iconData) {
        let splittedIconData:string[];
        let iconName:string;
        let iconSize:Size = {width: 14, height: 14};
        let iconColor:string|undefined = tinycolor(foreground).toString() || undefined;

        if (iconData.includes("FontAwesome")) {
            if (!iconData.includes(';')) {
                splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(',');

                iconName = "fa fa-" + splittedIconData[0];
                iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
                iconColor = foreground ? tinycolor(foreground).toString() : undefined;

                return {icon: iconName, size: iconSize, color: iconColor};
            }
            else {
                splittedIconData = iconData.slice(iconData.indexOf('.') + 1).split(';');

                iconName = "fa fa-" + splittedIconData[0];
                let sizeFound = false;
                let colorFound = false;

                splittedIconData.forEach((prop:string) => {
                    if (prop.includes("size")) {
                        iconSize = {width: parseInt(prop.substring(prop.indexOf('=')+1)), height: parseInt(prop.substring(prop.indexOf('=')+1))};
                        sizeFound = true;
                    }
                    else if (prop.includes("color")) {
                        iconColor = tinycolor(prop.substring(prop.indexOf('=')+1, prop.indexOf(','))).toString();
                        colorFound = true;
                    }
                });

                if (!sizeFound)
                    iconSize = {width: parseInt(iconData.slice(iconData.indexOf('.') + 1)[1]), height: parseInt(iconData.slice(iconData.indexOf('.') + 1)[2])}
                if (!colorFound)
                    iconColor = foreground ? tinycolor(foreground).toString() : undefined;
                return {icon: iconName, size: iconSize, color: iconColor}
            }
        }
        else {
            splittedIconData = iconData.split(',');
            iconName = splittedIconData[0];
            iconSize = {width: parseInt(splittedIconData[1]), height: parseInt(splittedIconData[2])};
            return { icon: iconName, size: iconSize, color: iconColor};
        }
    }
    else {
        return {icon: undefined, size: undefined, color: undefined};
    }
}