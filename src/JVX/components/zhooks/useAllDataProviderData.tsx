/** React imports */
import {useCallback, useContext, useEffect, useState} from "react";

/** Other imports */
import {jvxContext} from "../../jvxProvider";

/**
 * This hook returns the current data of all dataproviders of a component as map
 * @param compId - the component id of the screen
 * @returns the current data of all dataproviders of a component as map
 */
const useAllDataProviderData = (compId:string, databooks:string[]): Map<string, Array<any>> => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(jvxContext);

    /** Returns dataproviders of a component or undefined if there are no dataproviders */
    const getDataProvidersOfComp = useCallback(() => {
        const dataProviders = context.contentStore.dataProviderData.get(compId);
        if (dataProviders) {
            for (const [key] of dataProviders?.entries()) {
                if (!databooks.includes(key))
                    dataProviders.delete(key)
            }
            return dataProviders
        }
        else
            return new Map()
    },[compId, databooks, context.contentStore])
    /** Current state of dataMap */
    const [dataMap, setDataMap] = useState<Map<string, Array<any>>>(getDataProvidersOfComp());

    /**
     * Subscribes to screenDataChange
     * @returns unsubscribes from screenDataChange
     */
    useEffect(() => {
        /** sets the state */
        const onScreenDataChange = () => {
            const a = getDataProvidersOfComp()
            setDataMap(new Map(a));
        }

        context.subscriptions.subscribeToScreenDataChange(compId, onScreenDataChange);
        return () => context.subscriptions.unsubscribeFromScreenDataChange(compId);
    },[context.subscriptions, compId, getDataProvidersOfComp])

    return dataMap
}
export default useAllDataProviderData;