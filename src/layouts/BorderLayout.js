import React, { Component } from 'react';
import { toPx } from "../component/helper/ToPx";

class BorderLayout extends Component {

    elemNorth;
    elemWest;
    elemCenter;
    elemEast;
    elemSouth;

    state = {
        preferredWidth: 0,
        preferredHeight: 0
    }

    componentDidMount() {
        this.calculateSizes()
    }

    addLayoutComponents() {
        this.props.subjects.forEach(subject => {
            if (subject.props.data.constraints) {
                switch(subject.props.data.constraints) {
                    case 'North':
                        this.elemNorth = subject;
                        break;
                    case 'West':
                        this.elemWest = subject;
                        break;
                    case 'Center':
                        this.elemCenter = subject;
                        break;
                    case 'East':
                        this.elemEast = subject;
                        break;
                    case 'South':
                        this.elemSouth = subject;
                        break;
                    default: return null
                }
            }
        });
    }

    calculateSizes() {
        let size = this.props.getPreferredSize(this.props.component);
        let preferredWidth = size.getWidth() - this.props.margins.getMarginLeft() - this.props.margins.getMarginRight();
        let preferredHeight = size.getHeight() - this.props.margins.getMarginTop() - this.props.margins.getMarginLeft();
        this.setState({preferredWidth: preferredWidth, preferredHeight: preferredHeight})
    }

    render() {
        this.addLayoutComponents()
        return (
        <div className="p-grid p-nogutter borderlayout" style={{height: this.state.preferredHeight, "flexFlow":"column", width: "100%", padding: '0', 
                                                                marginTop: toPx(this.props.margins.getMarginTop()), marginLeft: toPx(this.props.margins.getMarginLeft()),
                                                                marginBottom: toPx(this.props.margins.getMarginBottom()), marginRight: toPx(this.props.margins.getMarginRight())}}>
            <div className="p-col-12 north" style={{textAlign:"center",
                                                    padding: '0',
                                                    marginBottom: toPx(this.props.gaps.getVerticalGap())}}>
                {this.elemNorth}
            </div>
            <div className="p-grid p-nogutter p-align-center" style={{height:"100%"}}>
                <span className="p-col-fixed west" style={{textAlign:"center", width:"auto", padding: '0', marginRight: toPx(this.props.gaps.getHorizontalGap())}}>
                    {this.elemWest}
                </span>
                <span className="p-col center" style={{textAlign:"center", height:"100%", padding: '0', width:"100%"}}>
                    {this.elemCenter}
                </span>
                <span className="p-col-fixed east" style={{textAlign:"center", width:"auto", padding: '0', marginLeft: toPx(this.props.gaps.getHorizontalGap())}}>
                    {this.elemEast}
                </span>
            </div>
            <div className="p-col-12 south" style={{textAlign:"center", padding: '0', marginTop: toPx(this.props.gaps.getVerticalGap())}}>
                {this.elemSouth}
            </div>
        </div>);
    }
} 
export default BorderLayout;