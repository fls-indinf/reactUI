/** Other imports */
import REQUEST_ENDPOINTS from "../../request/REQUEST_ENDPOINTS";
import Server from "../../Server";
import {createSetValuesRequest} from "../../factories/RequestFactory";

/**
 * Builds a setValuesRequest and sends it to the server
 * @param dataProvider - the dataprovider
 * @param name - the componentId
 * @param columnName - the column name
 * @param value - current value of component to send
 * @param lastValue previous value that was entered in the component
 * @param server - the server instance
 */
export function sendSetValues(dataProvider:string, name:string|undefined, columnName:string|string[], value:string|number|boolean|Array<any>|null, server:Server) {
    const req = createSetValuesRequest();
    req.dataProvider = dataProvider;
    req.componentId = name;
    /** Send as array if its not already an array */
    req.columnNames = Array.isArray(columnName) ? columnName : [columnName];
    let tempValues:any = value;
    /** If value is an object only send the values of the object */
    if (typeof value === "object" && value !== null) {
        tempValues = Object.values(value)
    }
    /** Send as array if its not already an array */
    req.values = Array.isArray(tempValues) ? tempValues : [tempValues];
    server.sendRequest(req, REQUEST_ENDPOINTS.SET_VALUES);
}