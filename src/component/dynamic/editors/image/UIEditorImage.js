import Base from "../../Base";
import React from 'react';
class UIEditorImage extends Base {
    render() { 
        return ( <span id={this.props.data.id} style={this.state.style}>BILD</span> );
    }
}
 
export default UIEditorImage;