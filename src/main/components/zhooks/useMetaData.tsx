/** React imports */
import { useContext, useEffect, useState } from "react";

/** Other imports */
import { appContext } from "../../AppProvider";
import { LengthBasedColumnDescription, MetaDataResponse, NumericColumnDescription } from "../../response";
import { getMetaData } from "../util";

//T is the column which metadata is needed, if column is set it is looking for U which is whether the column is numeric or length.
//If T is not set the whole metadata-response is returned
export type FullOrColumn<T extends string|undefined, U extends "numeric"|undefined> = T extends string ? (U extends "numeric" ? NumericColumnDescription : LengthBasedColumnDescription) : MetaDataResponse

/**
 * This hook returns either the full metadata of a dataprovider or only the metadata of a column if the column parameter is set.
 * @param compId - the component id of the screen
 * @param dataProvider - the dataprovider which metadata is needed
 * @param column - the column which should be extracted out of the metadata
 * @param numeric - if the column-metadata is numeric or length based
 * @returns metadata
 */
const useMetaData = <T extends string|undefined, U extends "numeric"|undefined>(compId:string, dataProvider:string, column?:T, numeric?:U):FullOrColumn<T, U>|undefined => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);

    /** Current state of the data received by the dataprovider */
    const [metaData, setMetaData] = useState<FullOrColumn<T, U>|undefined>(getMetaData(compId, dataProvider, context.contentStore, column));

    useEffect(() => {
        context.subscriptions.subscribeToMetaData(compId, dataProvider, () => setMetaData(getMetaData(compId, dataProvider, context.contentStore, column)));
        return () => context.subscriptions.unsubscribeFromMetaData(compId, dataProvider, () => setMetaData(getMetaData(compId, dataProvider, context.contentStore, column)));
    }, [context.subscriptions, compId, dataProvider, context.contentStore]);

    return metaData;
}
export default useMetaData