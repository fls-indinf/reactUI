/** React imports */
import { useContext } from "react";

/** Other imports */
import { jvxContext } from "../../jvxProvider";

/**
 * This hook returns the value of a customStartup property set by the user 
 * @param key - the customStartup property
 */
const useGetCustomProperty = (key:string) => {
    const context = useContext(jvxContext);

    return context.contentStore.customProperties.get(key);
}
export default useGetCustomProperty