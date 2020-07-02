import React from 'react';
import { Component } from 'react';
import { registerScreen } from '../../handling/TowerV4';
import { Redirect, withRouter } from 'react-router-dom';
import BaseV2 from './BaseV2';


class BScreen extends Component {

    constructor(props) {
        super(props);

        registerScreen(this);

        this.addWindow = this.addWindow.bind(this);
        this.removeWindow = this.removeWindow.bind(this);
    }

    /**
     * Calls {setState} to set {state.route} with a Redirect Component
     * which will redirect to the window once rendered. 
     * @param {string} navigateTo componentId to route to
     */
    routeToScreen(navigateTo){
        this.setState({route: <Redirect to={"/"+navigateTo}/>})
    }

    /**
     * Adds (toAdd) to {state.content} and calls {setState}
     * with updated content  
     * @param {BaseV2} toAdd initalised container element
     */
    addWindow(toAdd){
        let con = [...this.state.content];
        con.push(toAdd)
        this.setState({content: con});
    }

    /**
     * Removes top level element in {state.content} by its componentId
     * calls {setState} with updated content
     * @param {string} id componentId of top element
     */
    removeWindow(id){
        let con = [...this.state.content];
        let toDelete = con.find(e => e.props.componentid === id);
        let indexToDelete = con.indexOf(toDelete);
        con.splice(indexToDelete,1);
        this.setState({content: con});
    }

    /**
     * Calls {setState} and sets the content to an empty array
     * deleting all open windows
     */
    removeAll(){
        this.setState({content: []});
    }
}
 
export default BScreen;