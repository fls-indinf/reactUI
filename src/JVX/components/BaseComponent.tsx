import { UIFont } from "./compprops/UIFont";
import LoadCallBack from "./util/LoadCallBack";

interface BaseComponent{
    onLoadCallback?: LoadCallBack
    id: string,
    parent?: string
    name: string,
    className: string,
    "~remove"?: boolean
    "~destroy"?: boolean
    visible?: boolean
    constraints: string
    preferredSize?: string
    background?: string
    foreground?: string
    margins?: string
    horizontalAlignment?: 0 | 1 | 2| 3
    verticalAlignment?: 0 | 1 | 2| 3
    font?: string|UIFont
    image?: string
    focusable?: boolean
    tabIndex?: number
    style?: string
}
export default BaseComponent