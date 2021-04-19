/** Other imports */
import BaseResponse from "./BaseResponse";

/** Interface for DownloadDataResponse */
interface DownloadResponse extends BaseResponse{
    fileId: string;
    fileName: string;
    url: string
}
export default DownloadResponse