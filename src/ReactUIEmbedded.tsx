/* Copyright 2022 SIB Visions GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { FC, useContext, useLayoutEffect } from "react";
import PrimeReact from 'primereact/api';
import { Route, Switch } from "react-router-dom";
import UIManager from "./application-frame/screen-management/ui-manager/UIManager";
import { Login } from "./application-frame/login";
import LoadingScreen from './application-frame/loading/Loadingscreen';
import { ICustomContent } from "./MiddleMan";
import AppWrapper from "./AppWrapper";
import { appContext } from "./moduleIndex";

/**
 * This component manages the start and routing of the application, if the application is started embedded.
 * @param props - Custom content, which a user can define when using reactUI as library e.g CustomScreens, CustomComponents, ReplaceScreen
 */
const ReactUIEmbedded:FC<ICustomContent> = (props) => {
    const context = useContext(appContext);

    /** PrimeReact ripple effect */
    PrimeReact.ripple = true;

    useLayoutEffect(() => {
        if (props.style && props.style.height) {
            document.documentElement.style.setProperty("--main-height", props.style.height as string)
        }
    },[props.style]);

    return (
        <AppWrapper embedOptions={props.embedOptions}>
            {context.appReady ?
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div className="embed-frame">
                        <Switch>
                            <Route exact path={"/login"} render={() => <Login />} />
                            <Route exact path={"/home/:componentId"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                            <Route path={"/home"} render={() => <UIManager customAppWrapper={props.customAppWrapper} />} />
                        </Switch>
                    </div>
                </>
                :
                <>
                    <span style={{ fontWeight: 'bold', fontSize: "2rem" }}>
                        ReactUI Embedded WorkScreen
                    </span>
                    <div className="embed-frame">
                        <LoadingScreen />
                    </div>
                </>}
        </AppWrapper>
    )
}
export default ReactUIEmbedded