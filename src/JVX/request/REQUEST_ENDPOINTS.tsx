enum REQUEST_ENDPOINTS  {
    STARTUP = "/api/startup",
    LOGIN = "/api/login",
    LOGOUT = "/api/logout",
    PRESS_BUTTON = "/api/v2/pressButton",
    OPEN_SCREEN = "/api/v2/openScreen",
    DEVICE_STATUS = "/api/deviceStatus",
    UPLOAD = "/upload",
    SELECT_ROW = "/api/dal/selectRecord",
    FETCH = "/api/dal/fetch",
    FILTER = "/api/dal/filter",
    SET_VALUE = "/api/comp/setValue",
    SET_VALUES = "/api/dal/setValues",
    SELECT_TAB = "/api/comp/selectTab",
    CLOSE_TAB = "/api/comp/closeTab",
}
export default REQUEST_ENDPOINTS