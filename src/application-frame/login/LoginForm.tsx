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

import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import React, { CSSProperties, FC, FormEvent, useState } from "react";
import { createLoginRequest } from "../../main/factories/RequestFactory";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import ChangePasswordDialog from "../change-password/ChangePasswordDialog";
import ILoginCredentials from "./ILoginCredentials";
import REQUEST_KEYWORDS from "../../main/request/REQUEST_KEYWORDS";
import useConstants from "../../main/hooks/components-hooks/useConstants";
import { concatClassnames } from "../../main/util/string-util/ConcatClassnames";
import { translation } from "../../main/util/other-util/Translation";

/** Interface for the default-login form */
export interface ILoginForm extends ILoginCredentials {
    changeLoginMode: Function
    changeLoginData: Function
    errorMessage?: string
}

/**
 * Returns the login-form to log into the application.
 * @param props - the properties contains a function to change the login-mode
 */
const LoginForm:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar] = useConstants();

    /** State for username field */
    const [username, setUsername] = useState<string>("");

    /** State for password field */
    const [password, setPassword] = useState<string>("");

    /** State for remember-me checkbox */
    const [rememberMe, setRememberMe] = useState<boolean>(false);

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    /**
     * Sends a loginrequest to the server when the loginform is submitted.
     */
     const loginSubmit = (e: FormEvent<HTMLFormElement>) => {
        props.changeLoginData(username, password)
        e.preventDefault()
        const loginReq = createLoginRequest();
        loginReq.username = username;
        loginReq.password = password;
        loginReq.mode = "manual";
        loginReq.createAuthKey = rememberMe;
        context.server.loginError = undefined;
        context.subscriptions.emitLoginChanged(undefined, undefined)
        showTopBar(context.server.sendRequest(loginReq, REQUEST_KEYWORDS.LOGIN), topbar)
        context.subscriptions.emitMenuUpdate();
    }

    return (
        <>
            <ChangePasswordDialog
                username={username}
                password={password}
                loggedIn={false} />
            <form onSubmit={loginSubmit} className="login-form">
                <div className="login-logo-wrapper">
                    <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN + '?v=' + Date.now()} alt="logo" />
                </div>
                <div className="p-fluid">
                        {props.errorMessage && 
                        <div className="login-error-message p-field">
                            { translation.has(props.errorMessage) ? translation.get(props.errorMessage) : props.errorMessage}
                        </div>
                        }
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-user" />
                            <InputText
                                value={username}
                                id="username"
                                type="text"
                                autoComplete="username"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} />
                            <label htmlFor="username">{translation.get("Username")} </label>
                        </div>
                        <div className="p-field p-float-label p-input-icon-left">
                            <i className="pi pi-key" />
                            <InputText
                                value={password}
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)} />
                            <label htmlFor="password">{translation.get("Password")} </label>
                        </div>
                        {(context.appSettings.applicationMetaData.lostPasswordEnabled || context.appSettings.applicationMetaData.rememberMe) && 
                        <div className={concatClassnames(
                            "login-extra-options",
                            context.appSettings.applicationMetaData.lostPasswordEnabled ? "lost-password-enabled" : "")} >
                            {context.appSettings.applicationMetaData.rememberMe !== false && <div className="login-cbx-container">
                                <Checkbox
                                    inputId="rememberMe"
                                    className="remember-me-cbx"
                                    checked={rememberMe}
                                    onChange={(event) => setRememberMe(prevState => event.checked)} />
                                <label htmlFor="rememberMe" className="p-checkbox-label">{translation.get("Remember me?")}</label>
                            </div>}
                            {context.appSettings.applicationMetaData.lostPasswordEnabled &&
                                <Button
                                    type="button"
                                    className="lost-password-button rc-button mouse-border"
                                    style={{
                                        '--background': btnBgd,
                                        '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                                    } as CSSProperties}
                                    label={translation.get("Lost password")}
                                    icon="pi pi-question-circle"
                                    onClick={() => props.changeLoginMode("reset")} />
                            }
                        </div>}
                        <Button 
                            type="submit" 
                            className="login-button rc-button"
                            style={{
                                '--background': btnBgd,
                                '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                            } as CSSProperties} 
                            label={translation.get("Login")}
                            icon="pi pi-lock-open" />
                    </div>
            </form>
        </>
    )
}
export default LoginForm