const BaseClient = require('../baseclient.js');

class GrandID extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)

        this.clientInfo = {        
            name: "GrandID",                      //the name of this client
            version: "20210409",                         //revision/version for this client
            author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
            url: "https://github.com/DSorlov/eid-provider",       //where does this client live
            methods: ['auth','sign']                                  //should contain 'auth' and/or 'sign' depending on the module
        };
    };

    //Required method for polling/checking a existing request
    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        if (this.settings.provider==="freja") {
            var checkUrl = 'https://login.grandid.com/?sessionid='+data.id+"&poll=1";
            var result = await this._httpRequest(checkUrl,{headers:{'X-Requested-With': 'XMLHttpRequest'}});
            var resultData = JSON.parse(result.data);

            switch(resultData.status) {
                case "STARTED":
                    return this._createPendingMessage('notdelivered');
                case "DELIVERED_TO_MOBILE":
                    return this._createPendingMessage('user_in_app');
                case "CANCELED":
                case "REJECTED":
                    return this._createErrorMessage('cancelled_by_user');
                case "EXPIRED":
                    return this._createErrorMessage('expired_transaction');
                case "RP_CANCELLED":
                    return this._createErrorMessage('cancelled_by_idp');
                case "APPROVED":

                    checkUrl = 'https://login.grandid.com/?sessionid='+data.id+"&done=1";
                    await this._httpRequest(checkUrl,{headers:{'X-Requested-With': 'XMLHttpRequest'}});  
                    
                    result = await this._httpRequest(`${this.settings.endpoint}/json1.1/GetSession?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}&sessionId=${data.id}`);
                    
                    if (result.statusCode===200) {
                        var frejaResult = JSON.parse(result.data);

                        return this._createCompletionMessage(
                            frejaResult.userAttributes.requestedAttributes.ssn.ssn,
                            frejaResult.userAttributes.requestedAttributes.basicUserInfo.name,
                            frejaResult.userAttributes.requestedAttributes.basicUserInfo.surname,
                            frejaResult.userAttributes.requestedAttributes.basicUserInfo.name + ' ' + frejaResult.userAttributes.requestedAttributes.basicUserInfo.surname);

                    } else {
                        return this._createErrorMessage('api_error', 'Unknown response from API: '+result.statusMessage);
                    }

                default:
                    return this._createErrorMessage('api_error', resultData.errorObject.message);
            }
    

        } else {
            var result = await this._httpRequest(`${this.settings.endpoint}/json1.1/GetSession?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}&sessionId=${data.id}`);

            if (result.statusCode===599) {
                return this._createErrorMessage('internal_error',result.statusMessage);
            } else if (result.statusCode===200) {
                var resultData = JSON.parse(result.data);
    
                if (resultData.errorObject) {
                    if (resultData.errorObject.code==='NOTLOGGEDIN') {
                        return this._createErrorMessage('api_error', 'Probably using the wrong key: '+resultData.errorObject.message);
                     } else if (resultData.errorObject.code==='BANKID_MSG') {
                         if (resultData.errorObject.message.hintCode) {
                             switch(resultData.errorObject.message.hintCode) {
                                 case "expiredTransaction":
                                    return this._createErrorMessage('expired_transaction');
                                 case "outstandingTransaction":
                                    return this._createPendingMessage('notdelivered');
                                 case "NOTLOGGEDIN":
                                    return this._createPendingMessage('notdelivered');
                                 case "userSign":
                                    return this._createPendingMessage('user_in_app');
                                 case "noClient":
                                    return this._createPendingMessage('delivered');
                                 case "userCancel":
                                    return this._createErrorMessage('cancelled_by_user');
                                 case "cancelled":
                                    return this._createErrorMessage('cancelled_by_idp');
                                 case "startFailed":
                                    return this._createErrorMessage('initialization_error');
                                 default:
                                    return this._createErrorMessage('api_error', resultData.errorObject.message);
                                }
                         }
                     }else if (resultData.errorObject.code==='NETID_ACCESS_MESSAGE') {
                        if (resultData.errorObject.message) {
                            switch(resultData.errorObject.message) {
                                case "EXPIRED_TRANSACTION":
                                    return this._createErrorMessage('expired_transaction');
                                case "OUTSTANDING_TRANSACTION":
                                    return this._createPendingMessage('notdelivered');
                                case "NOTLOGGEDIN":
                                    return this._createPendingMessage('notdelivered');
                                case "USER_SIGN":
                                    return this._createPendingMessage('user_in_app');
                                case "CANCELLED":
                                    return this._createErrorMessage('cancelled_by_idp');
                                case "START_FAILED":
                                    return this._createErrorMessage('initialization_error');
                                default:
                                    return this._createErrorMessage('api_error', resultData.errorObject.message);
                               }
                        }
                    }else{
                         return this._createErrorMessage('api_error', resultData.errorObject.message);
                     }
             
                } else {
                    return this._createCompletionMessage(
                        resultData.userAttributes.personalNumber,
                        resultData.userAttributes.givenName,
                        resultData.userAttributes.surname,
                        resultData.userAttributes.name);
                }
    
            } else {
    
                try {
                    var resultData = JSON.parse(result.data);
    
                    if (resultData.errorObject.code==="BANKID_MSG") {
    
                        if (resultData.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', resultData.errorObject.message);
                        }                    
    
                    } else if (resultData.errorObject.code==="NETID_ACCESS_MESSAGE") {
    
                        if (resultData.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', resultData.errorObject.message);
                        }                    
    
                    } else if (resultData.errorOnbject.code==="FREJA_MSG") {
    
                        if (resultData.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', resultData.errorObject.message);
                        }                    
    
                    } else {
                        return this._createErrorMessage('api_error','Unknown error: '+resultData.message);
                    }
    
                } catch(err) {
                    return this._createErrorMessage('communication_error','Mallformed server message received: '+result.Data);
                }
                
            }
    
        }


    }

    //The grandid interface is hit and miss on succeeding with a cancel so we will just try and then igore and pretend it went well.
    async cancelRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        await this._httpRequest(`${this.settings.endpoint}/json1.1/Logout?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}&sessionId=${data.id}&cancelBankID=true`);        
        return this._createSuccessMessage();
    }

    //Required method for initializing a request
    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        const params = new URLSearchParams();
        params.append('callbackUrl', "https://localhost/");
        params.append('gui', false);

        if (this.settings.provider==="bankid") {
            params.append('personalNumber', data.id);
            params.append('mobileBankId', true);
            params.append('allowFingerprintSign', data.allowFingerprint ? data.allowFingerprint : true);
        } else if (this.settings.provider==="freja") {

            if (isNaN(data.id)) {
                params.append('infoType', 'EMAIL');
                params.append('userInfo', data.id);
            } else if (data.id.substring(1)==="+") {
                params.append('infoType', 'PHONE');
                params.append('userInfo', data.id);
            } else {
                params.append('personalNumber', data.id);
            }

            params.append('pushNotification', data.pushNotification ? data.pushNotification : "TGVnaXRpbWVyaW5nCg==");
        } else if (this.settings.provider==="siths") {
            params.append('personalNumber', data.id);
        }

        if (data.text) {
            params.append('userVisibleData', Buffer.from(data.text).toString('base64'));
        }

        var result = await this._httpRequest(`${this.settings.endpoint}/json1.1/FederatedLogin?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}`,{headers:{'Content-Type': 'application/x-www-form-urlencoded'}},params.toString());

        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            var resultData = JSON.parse(result.data);
            if (resultData.errorObject) {
                switch(resultData.errorObject.code) {
                    case 'INVALID_HSA_ID':
                    case 'UNKNOWN_USER':
                        return this._createErrorMessage('request_ssn_invalid', 'No such HSA ID found'); 
                    case 'FREJA_SIGN_NOT_ALLOWED':
                    case 'BANKID_SIGN_NOT_ALLOWED':
                        return this._createErrorMessage('api_error', 'Key is not allowed for document signing');
                    default:
                        return this._createErrorMessage('communication_error', 'Remote api returned error: '+ resultData.errorObject.message);
                }
            } else {

                var autoStartUrl = '';
                var autoStartToken = '';
                if (this.settings.provider==="bankid") {
                    autoStartUrl = "bankid:///?autostarttoken="+resultData.autoStartToken+"&redirect=null";
                    autoStartToken = resultData.autoStartToken;
                } else if (this.settings.provider==="freja") {

                    var response = await this._httpRequest(resultData.redirectUrl+"&init=1",{headers:{'X-Requested-With': 'XMLHttpRequest'}},'frejaSubmit=Logga%20in&userIdentifier='+data.id);
                    if (response.statusCode!==200) return this._createErrorMessage('internal_error','GrandIDFreja Workaround Failure');

                    var responseData = JSON.parse(response.data);
                    autoStartUrl = "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(responseData.token);
                    autoStartToken = responseData.token;                  

                } else {
                    autoStartUrl = "netid:///?autostarttoken="+resultData.autoStartToken+"&redirect=null";
                    autoStartToken = resultData.autoStartToken;
                }

                return this._createInitializationMessage(resultData.sessionId, {
                    autostart_url: autoStartUrl,
                    autostart_token: autoStartToken
                });
            }

        } else {

            try {
                var resultData = JSON.parse(result.data);

                if (resultData.errorObject.code==="BANKID_ERROR") {
                    switch(resultData.errorObject.message.response.errorCode)  {
                        case "alreadyInProgress":
                            return this._createErrorMessage('already_in_progress');
                        case "invalidParameters":
                            if (resultData.errorObject.message==='Incorrect personalNumber') {
                                return this._createErrorMessage('request_ssn_invalid');
                            } else if (resultData.errorObject.message==='Invalid userVisibleData') {
                                return this._createErrorMessage('request_text_invalid');
                            } else {
                                return this._createErrorMessage('api_error', resultData.errorObject.message);
                            }
                        default:
                                return this._createErrorMessage('api_error', resultData.errorObject.code);
                    }                
                }

                return this._createErrorMessage('api_error', resultData.errorObject.code);


            } catch(err) {
                return this._createErrorMessage('communication_error','Mallformed server message received: '+result.Data);
            }
            
        }
    }

}

module.exports = GrandID;