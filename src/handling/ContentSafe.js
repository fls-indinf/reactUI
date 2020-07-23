
class ContentSafe{

    flatContent= [];
    menuItems = [];
    meteData = new Map();

    updateContent(updatedContent){
        updatedContent.forEach(newEl => {
            let existingComp = this.flatContent.find(oldEl => oldEl.id === newEl.id)
            if(existingComp){
                if(newEl["~destroy"]){
                    let indexToDelete = this.flatContent.findIndex(x => x.id === newEl.id);
                    if(indexToDelete !== -1) this.flatContent.splice(indexToDelete, 1);              
                } else {
                    for(let newProp in newEl){
                        existingComp[newProp] = newEl[newProp]
                    }
                }   
            } else this.flatContent.push(newEl)
        });
        this.buildHierachy(this.flatContent);
    }

    updateMetaData(updatedMetaData){
        updatedMetaData.forEach(md => {
            this.meteData.set(md.dataProvider, md)
        });
    }

    getMetaData(provider){

    }

    buildHierachy(allComponents){
        let sortetComponents = [];
        let foundChildren = [];
        allComponents.forEach(parent => {
            parent.subjects = []; parent.subjects.length = 0;
            allComponents.forEach(child => {
                if(parent.id === child.parent) {
                    parent.subjects.push(child)
                    foundChildren.push(child)
                }
            });
            if(!foundChildren.some(x => x === parent)) sortetComponents.push(parent)
        });
    }

    getWindow(componentId){
        return this.flatContent.find(window => {
            if(!window.parent){
                return window.name === componentId;
            }
        });
    }

    deleteWindow(window){
        let toDelete = this.getWindow(window.componentId)
        let allSubs = this.getAllBelow(toDelete);
        allSubs.forEach(el => {
            let toDeleteId = this.flatContent.findIndex(x => x.id === el.id);
            this.flatContent.splice(toDeleteId, 1);
        });
        this.flatContent.splice(this.flatContent.findIndex(x => x.id === toDelete.id),1);
    }

    getAllBelow(parent){
        let subs = []
        parent.subjects.forEach(element => {
            subs.push(element);
            if(element.subjects.length > 0){
                subs.concat(this.getAllBelow(element));
            }
        });
        return subs;
    }
}
export default ContentSafe