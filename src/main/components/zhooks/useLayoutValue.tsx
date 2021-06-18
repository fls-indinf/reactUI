import { CSSProperties, useContext } from "react"
import { LayoutContext } from "src/main/LayoutContext"

const check = ['left', 'top', 'width', 'height'];

export const useLayoutValue = (id: string, fallback?: CSSProperties): CSSProperties | undefined => {
    const layoutData = useContext(LayoutContext);
    fallback = fallback || { position: 'absolute', visibility: 'hidden' };
    const mout = layoutData.has(id) ? layoutData.get(id) : fallback;
    const out = check.some(k => {
        const v = (mout as any)[k];
        return v !== undefined && isNaN(v);
    }) ? fallback : mout;
    //console.log(id, out, mout);
    return out;
}

export default useLayoutValue;