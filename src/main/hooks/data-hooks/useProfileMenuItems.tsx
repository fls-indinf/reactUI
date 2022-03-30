import { useEffect, useState, useContext, useCallback } from "react";
import { MenuItem, MenuItemCommandParams } from "primereact/menuitem";
import { appContext } from "../../AppProvider";
import { createLogoutRequest } from "../../factories/RequestFactory";
import { REQUEST_KEYWORDS } from "../../request";
import { useTranslation } from "..";
import { showTopBar, TopBarContext } from "../../components/topbar/TopBar";
import { ApplicationSettingsResponse } from "../../response";
import { version } from "../../../../package.json";

/**
 * Returns the profile-menu-options and handles the actions of each option.
 */
const useProfileMenuItems = () => {
    /** Use context to gain access for contentstore and server methods */
    const context = useContext(appContext);
    /** Current state of translations */
    const translations = useTranslation();
    /** topbar context to show progress */
    const topbar = useContext(TopBarContext);
    
    const [slideOptions, setSlideOptions] = useState<Array<MenuItem>>();

    const [changePwEnabled, setChangePwEnabled] = useState<boolean>(context.appSettings.changePasswordEnabled);

    /** removes authKey from local storage, resets contentstore and sends logoutRequest to server */
    const sendLogout = useCallback(() => {
        const logoutRequest = createLogoutRequest();
        localStorage.removeItem("authKey")
        context.contentStore.reset();
        showTopBar(context.server.sendRequest(logoutRequest, REQUEST_KEYWORDS.LOGOUT), topbar)
    }, [context.server, context.contentStore]);

    useEffect(() => {
        context.subscriptions.subscribeToAppSettings((appSettings:ApplicationSettingsResponse) => setChangePwEnabled(appSettings.changePassword));

        return () => context.subscriptions.unsubscribeFromAppSettings((appSettings:ApplicationSettingsResponse) => setChangePwEnabled(appSettings.changePassword));
    },[])
    
    useEffect(() => {
        const currUser = context.contentStore.currentUser;
        const profileMenuItems = changePwEnabled ? 
            [
                {
                    label: translations.get("Change password"),
                    icon: "pi pi-lock-open",
                    command(e: MenuItemCommandParams) {
                        context.subscriptions.emitDialog("change-password", false, false)
                    }
                },
                {
                    label: translations.get("Logout"),
                    icon: "pi pi-power-off",
                    command(e: MenuItemCommandParams) {
                        sendLogout()
                    }
                },
                {
                    label: "Info",
                    icon: "pi pi-info-circle",
                    command(e: MenuItemCommandParams) {
                        context.subscriptions.emitMessage({ name: "", message: "ReactUI Version: " + version }, "info");
                    }
                }
            ] :
            [
                {
                    label: translations.get("Logout"),
                    icon: "pi pi-power-off",
                    command(e: MenuItemCommandParams) {
                        sendLogout()
                    }
                }
            ]
        setSlideOptions([
            {
                label: currUser.displayName,
                icon: currUser.profileImage ? 'profile-image' : 'profile-image-null fas fa-user',
                items: profileMenuItems
            }
        ])
    }, [context.contentStore.currentUser, translations, changePwEnabled])

    return slideOptions;
}

export default useProfileMenuItems;