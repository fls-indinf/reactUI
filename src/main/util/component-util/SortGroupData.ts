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

import { LatLngExpression } from "leaflet";

/**
 * Returns the latitude and longitude value of a given point
 * @param point - the point to check
 * @param latColName - the latitude columnName in the databook
 * @param lngColName - the longitude columnName in the databook
 * @returns 
 */
export function getLatAndLngValue(point: any, latColName: string|undefined, lngColName: string|undefined) {
    const latValue = latColName ? point[latColName] : point.LATITUDE;
    const lat:number = typeof latValue === "string" && !isNaN(parseFloat(latValue)) ? parseFloat(latValue) : latValue;
    const lngValue = lngColName ? point[lngColName] : point.LONGITUDE;
    const lng:number = typeof lngValue === "string" && !isNaN(parseFloat(lngValue)) ? parseFloat(lngValue) : lngValue;

    return {lat: lat, lng: lng}
}

/**
 * Returns an array containing the groups sorted with their points for OpenStreetMap
 * @param groupData - the data of the groups sent by the server
 * @param gColName - the potentially set group column name
 * @param latColName - the potentially set latitude column name
 * @param lngColName - the potientally set longitude column name
 * @returns an array containing the groups sorted
 */
export function sortGroupDataOSM(groupData:any[], gColName:string|undefined, latColName:string|undefined, lngColName:string|undefined):any[] {
    const groupArray:any[] = [];
    groupData.forEach((groupPoint:any) => {
        const foundGroup = findGroup(groupArray, gColName, groupPoint);
        if (foundGroup) {
            const pointValues = getLatAndLngValue(groupPoint, latColName, lngColName);
            const tempPoint:LatLngExpression = [pointValues.lat, pointValues.lng];
            /** Add point to positions array of found group */
            foundGroup.positions.push(tempPoint);
        }
        else {
            const pointValues = getLatAndLngValue(groupPoint, latColName, lngColName);
            /** If there is no group found create a group with a groupname and an array containing all points and add it to the groupArray */
            const temp:any = {
                GROUP: gColName ? groupPoint[gColName] : groupPoint.GROUP, 
                positions: [[pointValues.lat, pointValues.lng]]
            };
            groupArray.push(temp);
        }
    });
    return groupArray
}

/**
 * Returns an array containing the groups sorted with their points for Google Maps
 * @param groupData - the data of the groups sent by the server
 * @param gColName - the potentially set group column name
 * @param latColName - the potentially set latitude column name
 * @param lngColName - the potientally set longitude column name
 * @returns an array containing the groups sorted
 */
export function sortGroupDataGoogle(groupData:any[], gColName:string|undefined, latColName:string|undefined, lngColName:string|undefined):any[] {
    const groupArray:any[] = [];
    groupData.forEach((groupPoint:any) => {
        const foundGroup = findGroup(groupArray, gColName, groupPoint);
        if (foundGroup) {
            const pointValues = getLatAndLngValue(groupPoint, latColName, lngColName);
            const tempPoint = {lat: pointValues.lat, lng: pointValues.lng};
            /** Add point to positions array of found group */
            foundGroup.paths.push(tempPoint);
        }
        else {
            const pointValues = getLatAndLngValue(groupPoint, latColName, lngColName);
            /** If there is no group found create a group with a groupname and an array containing all points and add it to the groupArray */
            const temp:any = {
                GROUP: gColName ? groupPoint[gColName] : groupPoint.GROUP,
                paths: [{lat: pointValues.lat, lng: pointValues.lng}]
            };
            groupArray.push(temp)
        }
    });
    return groupArray
}

/**
 * Searches the given array, if there is already a group for this point
 * @param groupArray - the array containing the groups
 * @param gColName - the potentially set group column name
 * @param groupPoint - the point containing the group
 * @returns the group found or undefined
 */
function findGroup(groupArray:any[], gColName:string|undefined, groupPoint:any) {
    const found = groupArray.find(existingGroup => {
        if (gColName) {
            return existingGroup.GROUP === groupPoint[gColName];
        }
        else
            return existingGroup.GROUP === groupPoint.GROUP
    });
    return found;
}