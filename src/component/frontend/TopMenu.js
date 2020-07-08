import React, { Component } from "react";
import "./TopMenu.scss"
import { AppConsumer } from './AppContext';
import {Menubar} from 'primereact/menubar';
import {InputText} from 'primereact/inputtext';
import {Sidebar} from 'primereact/sidebar';
import {TieredMenu} from 'primereact/tieredmenu';
import { withRouter } from "react-router-dom";

class TopMenuComponent extends Component {

    //state variables
    state = {
        menu: [],
        content: [],
        username: "",
        sideBarVisible: false
    }

    /**
     * When the menu component gets mounted, change the submenu icon
     */
    componentDidMount() {
        this.replaceSubIcon('down');
    }

    /**
     * When the menu component gets mounted, change the submenu icon
     * (In Future version maybe not needed)
     */
    componentDidUpdate() {
        this.replaceSubIcon('down');
    }

    replaceSubIcon(direction) {
        var elems = document.getElementsByClassName("pi-caret-" + direction);
        while(elems.length > 0) {
            for(let e of elems) {
                e.classList.remove("pi-caret-" + direction);
                e.classList.add("pi-angle-" + direction)
                e.style.fontSize = "1em"
            };
        }
    }

    /**
     * renders the Topmenu component, Sidebar is visible when the button gets clicked
     */
    render() {
        return (
            <AppConsumer>
                {({sendProfileOptions}) => (
                    <React.Fragment>
                    <div className="topMenuBar p-grid ">
                        <div className="logo-topmenu p-col-fixed">
                            <img src={process.env.PUBLIC_URL + '/assets/sibvisionslogo.png'} alt="firmenlogo"/>
                        </div>
                        <div className="menuBtnTop p-col-fixed" onClick={() => this.state.sideBarVisible ? this.setState({sideBarVisible: false}) : this.setState({sideBarVisible: true})}>
            	            <i className="pi pi-bars" style={{fontSize: '2em', fontWeight:'bold'}}/>
                        </div>
                        <Menubar model={this.props.menu}  className="p-col"/>
                        <div className="searchbar-topmenu p-col-fixed">
                            <div className="p-inputgroup">
                                <span className="p-inputgroup-addon">
                                    <i className="pi pi-search" style={{fontSize: "1em"}}></i>
                                </span>
                                <InputText placeholder="Suchen..." />
                            </div>
                        </div>
                        <div className="profile p-col-fixed">
                            <div className="profile-content">
                                <Menubar model={sendProfileOptions()} />
                            </div>
                        </div>
                    </div>
                    <Sidebar visible={this.state.sideBarVisible} position="left" onHide={() => this.setState({sideBarVisible:false})}>
                        <TieredMenu className="sidebar-menu" model={this.props.menu}/>
                    </Sidebar>
                </React.Fragment>
                )}
                
            </AppConsumer>
        )
    }
}
export default withRouter(TopMenuComponent);