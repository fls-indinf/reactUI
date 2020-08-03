export class Constraints {
    topAnchor
    leftAnchor
    bottomAnchor
    rightAnchor

    constructor(pLayout, pConstraintData, pTopAnchor, pLeftAnchor, pBottomAnchor, pRightAnchor) {
        if(pLayout !== undefined && pConstraintData !== undefined && pTopAnchor === undefined
            && pLeftAnchor === undefined && pBottomAnchor === undefined && pRightAnchor === undefined) {
            let constraintData = pConstraintData.split(';')
            this.topAnchor = pLayout.anchors.get(constraintData[0])
            this.leftAnchor = pLayout.anchors.get(constraintData[1])
            this.bottomAnchor = pLayout.anchors.get(constraintData[2])
            this.rightAnchor = pLayout.anchors.get(constraintData[3])
        }
        else if(pLayout === undefined && pConstraintData === undefined && pTopAnchor !== undefined
            && pLeftAnchor !== undefined && pBottomAnchor !== undefined && pRightAnchor !== undefined ) {
                this.topAnchor = pTopAnchor;
                this.leftAnchor = pLeftAnchor;
                this.bottomAnchor = pBottomAnchor;
                this.rightAnchor = pRightAnchor;
        }
        else {
        }
    }
}