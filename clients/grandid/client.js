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

            switch(result.json.status) {
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

                        return this._createCompletionMessage(
                            result.json.userAttributes.requestedAttributes.ssn.ssn,
                            result.json.userAttributes.requestedAttributes.basicUserInfo.name,
                            result.json.userAttributes.requestedAttributes.basicUserInfo.surname,
                            result.json.userAttributes.requestedAttributes.basicUserInfo.name + ' ' + result.json.userAttributes.requestedAttributes.basicUserInfo.surname);

                    } else {
                        return this._createErrorMessage('api_error', 'Unknown response from API: '+result.statusMessage);
                    }

                default:
                    return this._createErrorMessage('api_error', result.json.errorObject.message);
            }
    

        } else {
            var result = await this._httpRequest(`${this.settings.endpoint}/json1.1/GetSession?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}&sessionId=${data.id}`);

            if (result.statusCode===599) {
                return this._createErrorMessage('internal_error',result.statusMessage);
            } else if (result.statusCode===200) {
    
                if (result.json.errorObject) {
                    if (result.json.errorObject.code==='NOTLOGGEDIN') {
                        return this._createErrorMessage('api_error', 'Probably using the wrong key: '+result.json.errorObject.message);
                     } else if (result.json.errorObject.code==='BANKID_MSG') {
                         if (result.json.errorObject.message.hintCode) {
                             switch(result.json.errorObject.message.hintCode) {
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
                                    return this._createErrorMessage('api_error', result.json.errorObject.message);
                                }
                         }
                     }else if (result.json.errorObject.code==='NETID_ACCESS_MESSAGE') {
                        if (result.json.errorObject.message) {
                            switch(result.json.errorObject.message) {
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
                                    return this._createErrorMessage('api_error', result.json.errorObject.message);
                               }
                        }
                    }else{
                         return this._createErrorMessage('api_error', result.json.errorObject.message);
                     }
             
                } else {
                    return this._createCompletionMessage(
                        result.json.userAttributes.personalNumber,
                        result.json.userAttributes.givenName,
                        result.json.userAttributes.surname,
                        result.json.userAttributes.name);
                }
    
            } else {
    
                try {
    
                    if (result.json.errorObject.code==="BANKID_MSG") {
    
                        if (result.json.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', result.json.errorObject.message);
                        }                    
    
                    } else if (result.json.errorObject.code==="NETID_ACCESS_MESSAGE") {
    
                        if (result.json.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', result.json.errorObject.message);
                        }                    
    
                    } else if (result.json.errorOnbject.code==="FREJA_MSG") {
    
                        if (result.json.errorObject.message==='Session id does not exist') {
                            return this._createErrorMessage('request_id_invalid');
                        } else{
                            return this._createErrorMessage('api_error', result.json.errorObject.message);
                        }                    
    
                    } else {
                        return this._createErrorMessage('api_error','Unknown error: '+result.json.message);
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
            if (result.json.errorObject) {
                switch(result.json.errorObject.code) {
                    case 'INVALID_HSA_ID':
                    case 'UNKNOWN_USER':
                        return this._createErrorMessage('request_ssn_invalid', 'No such HSA ID found'); 
                    case 'FREJA_SIGN_NOT_ALLOWED':
                    case 'BANKID_SIGN_NOT_ALLOWED':
                        return this._createErrorMessage('api_error', 'Key is not allowed for document signing');
                    default:
                        return this._createErrorMessage('communication_error', 'Remote api returned error: '+ result.json.errorObject.message);
                }
            } else {

                var autoStartUrl = '';
                var autoStartToken = '';
                if (this.settings.provider==="bankid") {
                    autoStartUrl = "bankid:///?autostarttoken="+result.json.autoStartToken+"&redirect=null";
                    autoStartToken = result.json.autoStartToken;
                } else if (this.settings.provider==="freja") {

                    var response = await this._httpRequest(result.json.redirectUrl+"&init=1",{headers:{'X-Requested-With': 'XMLHttpRequest'}},'frejaSubmit=Logga%20in&userIdentifier='+data.id);
                    if (response.statusCode!==200) return this._createErrorMessage('internal_error','GrandIDFreja Workaround Failure');

                    autoStartUrl = "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(response.json.token);
                    autoStartToken = response.json.token;                  

                } else {
                    autoStartUrl = "netid:///?autostarttoken="+result.json.autoStartToken+"&redirect=null";
                    autoStartToken = result.json.autoStartToken;
                }

                return this._createInitializationMessage(result.json.sessionId, {
                    autostart_url: autoStartUrl,
                    autostart_token: autoStartToken
                });
            }

        } else {

            try {

                if (result.json.errorObject.code==="BANKID_ERROR") {
                    switch(result.json.errorObject.message.response.errorCode)  {
                        case "alreadyInProgress":
                            return this._createErrorMessage('already_in_progress');
                        case "invalidParameters":
                            if (result.json.errorObject.message==='Incorrect personalNumber') {
                                return this._createErrorMessage('request_ssn_invalid');
                            } else if (result.json.errorObject.message==='Invalid userVisibleData') {
                                return this._createErrorMessage('request_text_invalid');
                            } else {
                                return this._createErrorMessage('api_error', result.json.errorObject.message);
                            }
                        default:
                                return this._createErrorMessage('api_error', result.json.errorObject.code);
                    }                
                }

                return this._createErrorMessage('api_error', result.json.errorObject.code);


            } catch(err) {
                return this._createErrorMessage('communication_error','Mallformed server message received: '+result.Data);
            }
            
        }
    }

}

module.exports = GrandID;