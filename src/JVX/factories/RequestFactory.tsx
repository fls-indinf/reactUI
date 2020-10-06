import StartupRequest from "../request/StartupRequest";
import LoginRequest from "../request/LoginRequest";
import PressButtonRequest from "../request/PressButtonRequest";
import OpenScreenRequest from "../request/OpenScreenRequest";
import LogoutRequest from "../request/LogoutRequest";
import DeviceStatusRequest from "../request/DeviceStatusRequest";
import SelectRowRequest from "../request/SelectRowRequest";



const getClientId = (): string => {
    return sessionStorage.getItem("clientId") || "ClientIdNotFound"
}

export const createStartupRequest = (values?: StartupRequest): StartupRequest => {
    const req: StartupRequest = {
        layoutMode: values?.layoutMode || "generic",
        appMode: values?.appMode || "full",
        applicationName: values?.applicationName || "demo",

        authKey: values?.authKey,
        userName: values?.userName,
        password: values?.password,

        osName: values?.osName,
        osVersion: values?.osVersion,
        technology: values?.technology || "react",

        screenWidth: values?.screenWidth || 1920,
        screenHeight: values?.screenHeight || 1080,

        deviceType: values?.deviceType || 'Browser',
        deviceTypeModel: values?.deviceTypeModel || navigator.userAgent,

        readAheadLimit: values?.readAheadLimit || 100
    }
    return  req;
}

export const createLoginRequest = (values?: LoginRequest): LoginRequest => {
    const req: LoginRequest = {
        clientId: values?.clientId || getClientId(),
        createAuthKey: values?.createAuthKey || true,
        loginData: {
            userName: {
                componentId: values?.loginData.userName.componentId || "UserName",
                text: values?.loginData.userName.text
            },
            password: {
                componentId: values?.loginData.password.componentId || "Password",
                text: values?.loginData.password.text
            },
            action: {
                componentId: values?.loginData.action.componentId || "OK",
                label: values?.loginData.action.label || "Anmelden"
            }
        }
    }
    return req;
}

export const createPressButtonRequest = (values?: PressButtonRequest): PressButtonRequest => {
    const req: PressButtonRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

export const createOpenScreenRequest = (values?: OpenScreenRequest): OpenScreenRequest => {
    const req: OpenScreenRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId
    }
    return req;
}

export const createLogoutRequest = (values?: LogoutRequest): LogoutRequest => {
    const req: LogoutRequest = {
        clientId: values?.clientId || getClientId()
    }
    return req;
}

export const createDeviceStatusRequest = (values?: DeviceStatusRequest): DeviceStatusRequest => {
    const req: DeviceStatusRequest = {
        clientId: getClientId(),
        screenHeight: values?.screenHeight || 0,
        screenWidth: values?.screenWidth || 0
    }
    return req;
}

export const createSelectRowRequest = (values?: SelectRowRequest) => {
    const req: SelectRowRequest = {
        clientId: values?.clientId || getClientId(),
        componentId: values?.componentId,
        dataProvider: values?.dataProvider,
        filter: values?.filter
    }
    return req
}

