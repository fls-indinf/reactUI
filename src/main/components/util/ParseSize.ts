/** Other imports */
import { MapLocation, Dimension } from ".";

/**
 * Splits up the given size and returns it as a Size object
 * @param size - the size for the component
 * @returns split up size as object 
 */
export function parsePrefSize(prefSize:string|undefined):Dimension|undefined {
    if (prefSize) {
        const sizeSplitted = prefSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else
        return undefined;
}

export function parseMinSize(minSize:string|undefined):Dimension {
    if (minSize) {
        const sizeSplitted = minSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else {
        return {width: 0, height: 0};
    }
}

export function parseMaxSize(maxSize:string|undefined):Dimension {
    if (maxSize) {
        const sizeSplitted = maxSize.split(',');
        return {width: parseInt(sizeSplitted[0]), height: parseInt(sizeSplitted[1])};
    }
    else {
        return {width: 0x80000000, height: 0x80000000};
    }
}

/**
 * Splits up the given location and returns it as a MapLocation object
 * @param location - the location for the point
 * @returns split up location (longitude, latitude) as object
 */
export function parseMapLocation(location:string|undefined):MapLocation|undefined {
    if (location) {
        const locationSplitted = location.split(',');
        return {latitude: parseFloat(locationSplitted[0]), longitude: parseFloat(locationSplitted[1])};
    }
    else
        return undefined;
}