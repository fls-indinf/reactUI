import React, { Component } from "react";
import "./Content.css"
import TopMenuComponent from "./TopMenu";
import MenuComponent from "./Menu";
import FooterComponent from "./Footer"
import { stretch } from "./Stretch";
import {Card} from 'primereact/card';

class ContentComponent extends Component {

    componentDidMount() {
        if(!this.props.menuTop) {
            stretch('content-sidemenu');
        }
    }

    render() {
        if(this.props.menuTop) {
            return (
                <React.Fragment>
                    <TopMenuComponent menu={this.props.menu}/> 
                    <div className="content-topmenu">
                        <div className="p-grid">
                           <div className="p-col-6">
                                <Card>
                                    {this.props.content}
                                </Card>
                             </div>
                            <div className="p-col-6">
                            </div>
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-topmenu"/>
                    </div>
                </React.Fragment>
            )
        }
        else {
            return (
                <React.Fragment>
                    <MenuComponent/>
                    <div className="content-sidemenu">
                        <div className="p-grid">
                            <div className="p-col-6">
                            <Card>
                                {console.log(this.props.content)}
                                {this.props.content}
                            </Card>
                            </div>
                            <div className="p-col-6">
                                <Card title="Ausgänge">
                                    <p>50 Zahlungsausgänge</p>
                                    <p>30.000€</p>
                                </Card>
                            </div>
                        </div>
                        <FooterComponent menuTop={this.props.menuTop} divToCheck="content-sidemenu"/>
                    </div>
                </React.Fragment>
            )
        }
    }
}

export default ContentComponent;