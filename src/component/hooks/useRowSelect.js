import { useEffect, useState, useContext } from 'react';
import { RefContext } from '../helper/Context';

function useRowSelect(columnName) {
    const [selectedColumn, editColumn] = useState();
    const con = useContext(RefContext);

    useEffect(()=> {
        const sub = con.contentStore.selectedDataRowChange.subscribe(row => {
            if(row[columnName]) editColumn(row[columnName])
            else editColumn ("")
        });
        return function cleanUp(){
            sub.unsubscribe();
        }
    });
    return [selectedColumn , editColumn];
}
export default useRowSelect;