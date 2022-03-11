/** Other imports */
import ContentStore from "../../ContentStore";
import { ColumnDescription, MetaDataResponse } from "../../response";
import { FullOrColumn } from "../zhooks/useMetaData";

/**
 * Returns the metadata of the given dataprovider
 * @param screenName - the component id of the screen
 * @param dataProvider - the dataprovider of the metadata wanted
 * @param contentStore - the contentstore instance
 * @returns the metadata of the given dataprovider
 */
export function getMetaData<T extends string|undefined, U extends "numeric"|undefined>(screenName:string, dataProvider:string, contentStore:ContentStore, column?:T):FullOrColumn<T, U>|undefined {
    const fullMetaData = contentStore.getDataBook(screenName, dataProvider)?.metaData;
    if (fullMetaData) {
        if (column) {
            const columnMetaData = fullMetaData.columns.find(c => c.name === column);
            if (columnMetaData) {
                return columnMetaData as FullOrColumn<T, U>
            }
        }
        else {
            return fullMetaData as FullOrColumn<T, U>;
        }
    }
    return undefined
}