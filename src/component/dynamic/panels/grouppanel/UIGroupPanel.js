import React from 'react';
import Base from '../../Base';
import { RefContext } from '../../../helper/Context';
import { getPreferredSize } from '../../../helper/GetPreferredSize';

class UIGroupPanel extends Base {

    componentDidMount() {
        this.startUp();
        this.context.contentStore.emitSizeCalculated({size: getPreferredSize(this), id: this.props.id, parent: this.props.parent, firstTime: true});
    }

    render() {
        let bgdColor = this.getPanelBgdColor();
        return (
            <span id={this.props.id} style={{height: '100%', background: bgdColor, ...this.props.layoutStyle}}>
                {this.insertLayout()}
            </span>
        )
    }
}
UIGroupPanel.contextType = RefContext;
export default UIGroupPanel;