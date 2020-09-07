export type onLoadCallBack = (id: string, height: number, width:number) => void

interface BaseComponent{
    onLoadCallback?: onLoadCallBack
    id: string,
    parent: string | undefined
    name: string,
    className: string,
    "~remove": boolean | undefined,
    "~destroy": boolean | undefined,
    isVisible: boolean | undefined,
    constraints: string
    preferredSize?: string
}
export default BaseComponent