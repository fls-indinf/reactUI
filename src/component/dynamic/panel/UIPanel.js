import React from 'react';
import Base from '../Base';
import './UIPanel.scss'
import FormLayout from '../../layouts/FormLayout'
import BorderLayout from '../../layouts/BorderLayout'
import FlowLayout from '../../layouts/FlowLayout';
import GridLayout from "../../layouts/GridLayout";
import { Gaps } from '../../layouts/layoutObj/Gaps';
import { Margins } from '../../layouts/layoutObj/Margins';
import { Orientation } from '../../layouts/layoutObj/Orientation';
import { Alignments } from "../../layouts/layoutObj/Alignments";
import { GridSize } from '../../layouts/layoutObj/GridSize';


class UIPanel extends Base {
    insertLayout() {
        if (this.state.content !== undefined) {
            let margins = new Margins(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(0, 4))
            let gaps = new Gaps(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(4, 6))
            switch (this.props.data.layout.substring(0, this.props.data.layout.indexOf(','))) {
                case "FormLayout":
                    var alignments = new Alignments(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(6, 8), 'form')
                        return <FormLayout
                                    component={this}
                                    layout={this.props.data.layout}
                                    layoutData={this.props.data.layoutData}
                                    subjects={this.state.content}
                                    margins={margins}
                                    gaps={gaps}
                                    alignments={alignments}
                                    preferredSize={this.getPreferredSize(this)}
                                    minimumSize={this.props.data.minimumSize}
                                    maximumSize={this.props.data.maximumSize}
                                    getPreferredSize={this.getPreferredSize}
                                    getMinimumSize={this.getMinimumSize}
                                    getMaximumSize={this.getMaximumSize}/>;      
                case "BorderLayout":
                        return <BorderLayout 
                                    component={this}
                                    subjects={this.state.content}
                                    margins={margins}
                                    gaps={gaps}
                                    preferredSize={this.getPreferredSize(this)}
                                    minimumSize={this.props.data.minimumSize}
                                    maximumSize={this.props.data.maximumSize}
                                    getPreferredSize={this.getPreferredSize}
                                    getMinimumSize={this.getMinimumSize}
                                    getMaximumSize={this.getMaximumSize}/>;
                case "FlowLayout":
                        let orientation = new Orientation(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(6, 7));
                        alignments = new Alignments(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(7, 10), 'flow');
                        return <FlowLayout 
                                    component={this}
                                    subjects={this.state.content}
                                    margins={margins}
                                    gaps={gaps}
                                    orientation={orientation}
                                    alignments={alignments}
                                    preferredSize={this.getPreferredSize(this)}
                                    minimumSize={this.props.data.minimumSize}
                                    maximumSize={this.props.data.maximumSize}
                                    getPreferredSize={this.getPreferredSize}
                                    getMinimumSize={this.getMinimumSize}
                                    getMaximumSize={this.getMaximumSize}
                                    />;
                case "GridLayout":
                        let gridSize = new GridSize(this.props.data.layout.substring(this.props.data.layout.indexOf(',')+1, this.props.data.layout.length).split(',').slice(6, 8));
                        return <GridLayout subjects={this.state.content} margins={margins} gaps={gaps} gridSize={gridSize}/>
                default: return null;
            }
        }
        
    }

    render() {
        return (
        <div id={this.props.data.id} className="p-col-12" style={{ height: '100%'}}>
            {this.insertLayout()}
        </div>
        );
    }
}
 
export default UIPanel;