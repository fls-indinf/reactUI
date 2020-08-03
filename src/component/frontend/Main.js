import React, { Component } from 'react';
import { RefContext } from '../helper/Context';
import { withRouter } from 'react-router-dom';
import { stretch } from "./Stretch"; 
import FooterComponent from "./Footer"

import "./Main.scss";


class Main extends Component {

    state = { flip : false}

    componentDidMount() {
        let windowData = this.context.contentStore.getWindow(this.props.match.params.compId);
        if(this.context.menuLocation === "side") {
            stretch('content-sidemenu');
        }
        if(windowData){
            let mainPanel = this.context.uiBuilder.compontentHandler(windowData)
            this.setState({content: mainPanel})
        }   
    }


    render() { 
        return (
            <React.Fragment>
                <div className={"content-" + this.context.menuLocation + "menu"}>
                    <div className="p-grid parent-grid" style={{backgroundColor:"#C8C8C8"}}>
                        {this.state.content}
                    </div>
                </div>
                <FooterComponent menuLocation={this.context.menuLocation} />
            </React.Fragment>
            
        );
    }
}
Main.contextType = RefContext
export default withRouter(Main);