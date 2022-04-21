import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import React, { CSSProperties, FC, useContext, useState } from "react";
import tinycolor from "tinycolor2";
import { showTopBar } from "../../main/components/topbar/TopBar";
import { REQUEST_KEYWORDS } from "../../main/request";
import { createCancelLoginRequest, createLoginRequest, useConstants } from "../../moduleIndex";
import { LoginContext } from "./Login";
import { ILoginForm } from "./LoginForm";

/**
 * Returns the Multi-Factor-Authentication Mask for a TextInput authentication
 * @param props - the properties contains a function to change the login-mode
 */
const MFAText:FC<ILoginForm> = (props) => {
    /** Returns utility variables */
    const [context, topbar, translations] = useConstants();

    const loginContext = useContext(LoginContext);

    /** State of the email field */
    const [code, setCode] = useState<string>("");

    /** The button background-color, taken from the "primary-color" variable of the css-scheme */
    const btnBgd = window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');

    const sendAuthCode = () => {
        if (!code) {
            context.subscriptions.emitMessage({ message: translations.get("The authentication code is required"), name: "" });
        }
        else {
            const codeReq = createLoginRequest();
            codeReq.username = loginContext.username;
            codeReq.password = loginContext.password;
            codeReq.mode = "mFTextInput";
            codeReq.confirmationCode = code;
            showTopBar(context.server.sendRequest(codeReq, REQUEST_KEYWORDS.LOGIN), topbar)
        }
    }

    return (
        <form onSubmit={sendAuthCode} className="login-form">
            <div className="login-logo-wrapper">
                <img className="login-logo" src={(process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '') + context.appSettings.LOGO_LOGIN} alt="logo" />
            </div>
            <div className="p-fluid">
                <div className="p-field" style={{ fontSize: "1rem", fontWeight: "bold" }} >
                    {translations.get("Verification")}
                </div>
                <div className="p-field" style={{ marginBottom: "2rem" }}>
                    {translations.get("Please enter your confirmation code.")}
                </div>
                <div className="p-field p-float-label p-input-icon-left" style={{ marginBottom: "2rem" }}>
                    <i className="pi pi-key" />
                    <InputText
                        value={code}
                        id="code"
                        type="text"
                        autoComplete="code"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)} />
                    <label htmlFor="code">{translations.get("Code")} </label>
                </div>
                <div className="change-password-button-wrapper">
                    <Button 
                        type="button" 
                        className="lost-password-button rc-button" 
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Cancel")} 
                        icon="pi pi-times" 
                        onClick={() => {
                            showTopBar(context.server.sendRequest(createCancelLoginRequest(), REQUEST_KEYWORDS.CANCEL_LOGIN), topbar);
                            props.changeLoginMode("default")
                        }} />
                    <Button 
                        type="submit" 
                        className="lost-password-button rc-button"
                        style={{
                            '--background': btnBgd,
                            '--hoverBackground': tinycolor(btnBgd).darken(5).toString()
                        } as CSSProperties}
                        label={translations.get("Request")} 
                        icon="pi pi-send" />
                </div>
            </div>
        </form>
    )
}
export default MFAText;