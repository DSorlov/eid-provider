const BaseClient = require('../baseclient.js');

class BankID extends BaseClient {


    constructor(settings) {
        super(settings);
        this.settings = settings || {};        

        this.clientInfo = {        
            name: "BankID",
            version: "20210406",
            author: "Daniel Sörlöv <daniel@sorlov.com>",
            url: "https://github.com/DSorlov/eid",
            methods: ['auth','sign']
        };

        this._customAgent({
            pfx: this.settings.client_cert,
            passphrase: this.settings.password,
            ca: this.settings.ca_cert
        });

    };

    async pollAuthRequest(id) {
        return await this._pollRequest(id);
    }

    async pollSignRequest(id) {
        return await this._pollRequest(id);
    }

    async _pollRequest(id) {
        var postData = {
            orderRef: id
        };
        var result = await this._httpRequest(`${this.settings.endpoint}/collect`,{},JSON.stringify(postData));
        var resultData = result.data!=='' ? JSON.parse(result.data) : {};

        if (result.statusCode===599) {           
            return this._createErrorMessage('internal_error',result.statusMessage);        
        } else if (result.statusCode===200) {

            if (resultData.hintCode) {
                switch(resultData.hintCode) {
                    case "expiredTransaction":
                        return this._createErrorMessage('expired_transaction');
                    case "outstandingTransaction":
                        return this._createPendingMessage('notdelivered');
                    case "userSign":
                        return this._createPendingMessage('user_in_app');
                    case "noClient":
                        return this._createPendingMessage('delivered');
                    case "userCancel":
                        return this._createErrorMessage('cancelled_by_user');
                    case "cancelled":
                        return this._createErrorMessage('cancelled_by_idp');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error '${resultData.hintCode}' was received`);
                }                
            } else {

                if (resultData.status==="complete") {

                    return this._createCompletionMessage(
                        resultData.completionData.user.personalNumber,
                        resultData.completionData.user.givenName,
                        resultData.completionData.user.surname,
                        resultData.completionData.user.name, {
                            signature: resultData.completionData.signature,
                            ocspResponse: resultData.completionData.ocspResponse       
                        }); 

                } else {
                    return this._createErrorMessage('communication_error', result.data);
                }

            }

        } else {
            if (resultData.errorCode) {
                switch(resultData.errorCode)  {
                    case 'invalidParameters':                       
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error '${resultData.errorCode}' was received`);
                }
            } else {
                return this._createErrorMessage('communication_error',result.statusMessage);
            }
        }

    }

    async cancelAuthRequest(id) {
        return await this._cancelRequest(id);
    }

    async cancelSignRequest(id) {
        return await this._cancelRequest(id);
    }    

    async _cancelRequest(id) {
        var postData = {
            orderRef: id
        };
        var result = await this._httpRequest(`${this.settings.endpoint}/cancel`,{},JSON.stringify(postData));

        if (result.statusCode===599) {           
            return this._createErrorMessage('internal_error',result.statusMessage);        
        } else if (result.statusCode===200) {
            return this._createSuccessMessage();
        } else {
            return this._createErrorMessage('communication_error',result.statusMessage);
        }

    }

    async initAuthRequest(id,remoteip='127.0.0.1') {
        var ssn = this._unPack(id);
        var postData = {
            endUserIp: remoteip,
            personalNumber: ssn,
            requirement: {
                allowFingerprint: this.settings.allowFingerprint
        }};
        return await this._initRequest('auth', postData);        
    }

    async initSignRequest(id,text,remoteip='127.0.0.1') {
        var ssn = this._unPack(id);
        var postData = {
            endUserIp: remoteip,
            personalNumber: ssn,
            userVisibleData: Buffer.from(text).toString('base64'),
            requirement: {
                allowFingerprint: this.settings.allowFingerprint
        }};
        return await this._initRequest('sign', postData);
    }
    
    async _initRequest(method,postData) {

        var result = await this._httpRequest(`${this.settings.endpoint}/${method}`,{},JSON.stringify(postData));
        var resultData = result.data!=='' ? JSON.parse(result.data) : {};

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            return this._createInitializationMessage(resultData.orderRef, {
                method: method,
                autostart_token: resultData.autoStartToken,
                autostart_url: "bankid:///?autostarttoken="+resultData.autoStartToken+"&redirect=null"
            });

        } else {

            if (resultData.errorCode) {
                switch(resultData.errorCode)  {
                    case 'invalidParameters':                       
                        if (resultData.details==='Incorrect personalNumber') {
                            return this._createErrorMessage('request_ssn_invalid');
                        } else if (resultData.details==='Invalid userVisibleData') {
                            return this._createErrorMessage('request_text_invalid');
                        } else {
                            return this._createErrorMessage('api_error', `Unknwon parameter error '${resultData.details}' was received`);
                        }                    
                    case 'alreadyInProgress':
                        return this._createErrorMessage('already_in_progress');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error '${resultData.errorCode}' was received`);
                }
            } else {
                return this._createErrorMessage('communication_error',result.statusMessage);
            }

        };
        
    }

    // Supporting function to take care of any and all types of id that could be sent into bankid
    _unPack(data) {
        if (typeof data === 'string') {
            return data;
        } else {
            if (data.ssn) {
                return data.ssn;
            } else {
                return data.toString();
            }
        }    
    }    

}

module.exports = BankID;