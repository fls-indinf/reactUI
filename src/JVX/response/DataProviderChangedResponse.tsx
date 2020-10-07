import BaseResponse from "./BaseResponse";

interface DataProviderChangedResponse extends BaseResponse{
    dataProvider: string,
    insertEnabled?: boolean,
    deleteEnabled?: boolean,
    updateEnabled?: boolean,
    reload?: -1 | 0 | 1,
    selectedRow?: number
}
export default DataProviderChangedResponse