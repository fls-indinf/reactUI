class ServerCommunicator {
    BaseUrl = "http://localhost:8080/JVx.mobile/services/mobile";
    responseHandler = {};

    setResponseHandler(responseHandler){
        this.responseHandler = responseHandler;
    }
    
    sendRequest(endpoint, body){
        let reqOpt = {
            method: 'POST',
            body: JSON.stringify(body),
            credentials:"include"
        };
        let r = this.timeoutRequest(fetch(this.BaseUrl+endpoint, reqOpt), 2000)
        this.responseHandler.getResponse(r);
    }

    timeoutRequest(promise, ms){
        return new Promise((resolve, reject) => {
            let timeoutId= setTimeout(() => {
                reject(new Error("timeOut"))
            }, ms);
            promise
                .then(res => {
                    clearTimeout(timeoutId);
                    resolve(res);
                },
                err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        });
    }

    logIn(username, password){
        let info = {
            clientId: localStorage.getItem("clientId"),
            loginData: {
              userName: {
                componentId: "UserName",
                text: username
              },
              password: {
                componentId: "Password",
                text: password
              },
              action : {
                componentId: "OK",
                label: "Anmelden"
              }
            }
        }; this.sendRequest("/api/login",info);
    }

    logOut(){
        let info = {
            "clientId": localStorage.getItem("clientId")
        }; this.sendRequest("/api/logout", info);
    }

    pressButton(componentId){
        let body = {
            clientId: localStorage.getItem("clientId"),
            componentId: componentId
        }; this.sendRequest("/api/v2/pressButton", body);
    }

    startUp(screenHeight=600, screenWidth=800){
        let info = {
            layoutMode : "generic",
            appMode : "full",
            applicationName : "demo",
            screenWidth: screenWidth,
            screenHeight: screenHeight,

        }; this.sendRequest("/api/startup", info);
    }

    fetchDataFromProvider(dataProvider, timeout){
        let reqOpt = {
            method: 'POST',
            body: JSON.stringify({clientId: localStorage.getItem("clientId"), dataProvider: dataProvider}),
            credentials:"include"
        };
        return this.timeoutRequest(fetch(this.BaseUrl+"/api/dal/fetch", reqOpt), 2000);
    }

    deviceStatus(screenHeight=600, screenWidth=800){
        let reqOpt= {
            screenWidth: screenWidth,
            screenHeight: screenHeight,
            clientId: localStorage.getItem("clientId")
        }; this.sendRequest("/api/deviceStatus", reqOpt);   
    }




}
 
export default ServerCommunicator;