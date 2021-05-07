/** React imports */
import React, { createContext, FC, useState } from "react";

/** 3rd Party imports */
import { useHistory } from "react-router";

/** Other imports */
import Server from "./Server";
import ContentStore from "./ContentStore";
import { SubscriptionManager } from "./SubscriptionManager";

/** Type for AppContext */
type AppContextType={
    server: Server,
    contentStore: ContentStore,
    subscriptions: SubscriptionManager,
    //theme: string,
    //setTheme: Function
}

/** Contentstore instance */
const contentStore = new ContentStore();
/** subscriptionManager instance */
const subscriptions = new SubscriptionManager(contentStore)
/** Server instance */
const server = new Server(contentStore, subscriptions);

contentStore.setsubscriptionManager(subscriptions);
/** Initial value for state */
const initValue: AppContextType = {
    contentStore: contentStore,
    server: server,
    subscriptions: subscriptions
    //theme: "",
    //setTheme: () => {},
}

/** Context containing the server and contentstore */
export const appContext = createContext<AppContextType>(initValue)

/**
 * This component provides the appContext to its children
 * @param children - the children
 */
const AppProvider: FC = ({children}) => {
    const history = useHistory()

    /** Sets the initial state */
    const initState = (): AppContextType => {
        // const setTheme = (newTheme: string) => {
        //     setContextState({...contextState, theme: newTheme});
        // }
        const contentStore = new ContentStore();
        const subscriptions = new SubscriptionManager(contentStore);
        const server = new Server(contentStore, subscriptions, history);
        
        contentStore.setsubscriptionManager(subscriptions)

        return {
            //theme: "dark",
            //setTheme: setTheme,
            contentStore: contentStore,
            server: server,
            subscriptions: subscriptions
        }

    }

    /** Current State of the context */
    const [contextState, setContextState] = useState<AppContextType>(initState())




    return (
        <appContext.Provider value={contextState}>
            {children}
        </appContext.Provider>
    )
}
export default AppProvider


