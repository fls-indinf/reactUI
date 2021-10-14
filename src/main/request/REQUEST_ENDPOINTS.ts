/** Enum for server request endpoints */
enum REQUEST_ENDPOINTS {
    STARTUP = "/api/v4/startup",
    LOGIN = "/api/v2/login",
    LOGOUT = "/api/logout",
    CLOSE_SCREEN = "/api/closeScreen",
    PRESS_BUTTON = "/api/v2/pressButton",
    OPEN_SCREEN = "/api/v2/openScreen",
    DEVICE_STATUS = "/api/deviceStatus",
    UPLOAD = "/upload",
    DELETE_RECORD = "/api/dal/deleteRecord",
    INSERT_RECORD = "/api/dal/insertRecord",
    SELECT_ROW = "/api/dal/selectRecord",
    SELECT_COLUMN = "/api/dal/selectColumn",
    SELECT_TREE = "/api/dal/selectRecordTree",
    FETCH = "/api/dal/fetch",
    FILTER = "/api/dal/filter",
    SET_VALUE = "/api/comp/setValue",
    SET_VALUES = "/api/dal/setValues",
    SELECT_TAB = "/api/comp/selectTab",
    CLOSE_TAB = "/api/comp/closeTab",
    CLOSE_POPUP_MENU = "/api/comp/closePopupMenu ",
    SAVE = "/api/save",
    DAL_SAVE = "/api/dal/save",
    SORT = "/api/dal/sort",
    CHANGE_PASSWORD = "/api/changePassword",
    RESET_PASSWORD = "/api/resetPassword",
    SET_SCREEN_PARAMETER = "/api/setScreenParameter",
    MOUSE_CLICKED = "/api/mouseClicked",
    MOUSE_PRESSED = "/api/mousePressed",
    MOUSE_RELEASED = "/api/mouseReleased",
    RELOAD = "/api/reload",
    UI_REFRESH = "/api/uiRefresh",
    ROLLBACK = "/api/rollback",
    CHANGES = "/api/changes",
    FOCUS_GAINED = "/api/focusGained",
    FOCUS_LOST = "/api/focusLost",
    CLOSE_FRAME = "/api/closeFrame"
}
export default REQUEST_ENDPOINTS