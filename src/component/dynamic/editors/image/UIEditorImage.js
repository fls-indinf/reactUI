import Base from "../../Base";
import React from 'react';
import { checkCellEditorAlignments } from "../../../helper/CheckAlignments";
import placeHolder from "../../../../assets/imgs/IMAGE.png"
import { getPreferredSize } from "../../../helper/GetSizes";
import { RefContext } from "../../../helper/Context";

class UIEditorImage extends Base {

    constructor(props) {
        super(props);
        this.setImgAlignments = this.setImgAlignments.bind(this)
    }

    componentDidMount() {
        this.selectionSub = this.context.contentStore.selectedDataRowChange.subscribe(selection => {
            if(selection[this.props.columnName]){
                this.setState({img: "data:image/png;base64," + selection[this.props.columnName]});
            } else {
                this.setState({img : placeHolder})
            }
        })
        this.context.contentStore.emitSizeCalculated(
            {
                size: getPreferredSize({
                    id: this.props.id, 
                    preferredSize: this.props.preferredSize,
                    horizontalTextPosition: this.props.horizontalTextPosition,
                    minimumSize: this.props.minimumSize,
                    maximumSize: this.props.maximumSize
                }), 
                id: this.props.id, 
                parent: this.props.parent
            }
        );
    }

    setImgAlignments() {
        let alignments = checkCellEditorAlignments(this.props)
        var address = this.imgRef.getAttribute('href');
        var y = new Image();
        y.src = address;
        if (alignments.ha === 'left') {
            if (alignments.va === 'top') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '0%');
            }
            else if (alignments.va === 'center') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(0,' + -y.height + ')');
            }
            else if (alignments.va === 'stretch') {
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'center') {
            if (alignments.va === 'top') {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
            }
            else if (alignments.va === 'center') {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                this.imgRef.setAttribute('x', '50%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width/2) + ',0)');
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'right') {
            if (alignments.va === 'top') {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
            }
            else if (alignments.va === 'center') {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                this.imgRef.setAttribute('x', '100%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('transform', 'translate(' + -(y.width) + ',0)');
                this.imgRef.setAttribute('height', '100%');
                this.imgRef.setAttribute('width', y.width);
            }
        }
        else if (alignments.ha === 'stretch') {
            if (alignments.va === 'top') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '0%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
            }
            else if (alignments.va === 'center') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '50%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height/2) + ')');
            }
            else if (alignments.va === 'bottom') {
                this.imgRef.setAttribute('x', '0%');
                this.imgRef.setAttribute('y', '100%');
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', y.height);
                this.imgRef.setAttribute('transform', 'translate(0,' + -(y.height) + ')');
            }
            else if (alignments.va === 'stretch') {
                this.imgRef.setAttribute('width', '100%');
                this.imgRef.setAttribute('height', '100%');
            }
        }
    }

    componentWillUnmount() {
        this.selectionSub.unsubscribe();
    }

    render() {
        return (
            <svg id={this.props.id} style={{ ...this.props.layoutStyle, backgroundColor: this.props["cellEditor.background"] }}>
                <image
                    href={this.state.img ? this.state.img : placeHolder}
                    ref={ref => this.imgRef = ref}
                    onLoad={this.setImgAlignments}
                    preserveAspectRatio={this.props.cellEditor.preserveAspectRatio ? 'xMidYMid meet' : 'none'}
                />
            </svg>
        );
    }
}
UIEditorImage.contextType = RefContext;
export default UIEditorImage;