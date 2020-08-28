import React, { Component } from 'react';
import { Bounds } from './layoutObj/Bounds';

class NullLayout extends Component {

    state = {
        content: [this.props.subjects]
    }

    components = this.props.subjects

    componentDidMount() {
        this.layoutContainer(this.components)
    }

    layoutContainer(components) {
        let tempContent = [];
        components.forEach(component => {
            if (this.props.isVisible(component)) {
                let splittedBounds = component.props.bounds.split(',')
                let compBounds = new Bounds(splittedBounds);
                 
                let layoutStyle = {
                    position: "absolute",
                    height: compBounds.height,
                    width: compBounds.width,
                    top: compBounds.top,
                    left: compBounds.left,
                }
                let clonedComponent = React.cloneElement(component, { layoutStyle: { ...layoutStyle } })
                tempContent.push(clonedComponent);
            }
        })
        this.setState({ content: tempContent })
    }

    render() {
         
        return (
            <div className="nulllayout" style={{position: "relative", height: this.props.getPreferredSize(this.props.component).height, overflow: 'hidden'}}>
                {this.state.content}
            </div>
        )
    }
}
export default NullLayout