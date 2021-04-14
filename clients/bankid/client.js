const BaseClient = require('../baseclient.js');
var crypto = require('crypto');

class BankID extends BaseClient {


    constructor(settings) {
        super(settings);
        this.settings = settings || {};        

        this.clientInfo = {        
            name: "BankID",
            version: "20210406",
            author: "Daniel Sörlöv <daniel@sorlov.com>",
            url: "https://github.com/DSorlov/eid-provider",
            methods: ['auth','sign']
        };

        this._customAgent({
            pfx: this.settings.client_cert,
            passphrase: this.settings.password,
            ca: this.settings.ca_cert
        });

    };

    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var postData = {
            orderRef: data.id
        };
        var result = await this._httpRequest(`${this.settings.endpoint}/collect`,{},JSON.stringify(postData));

        if (result.statusCode===599) {           
            return this._createErrorMessage('internal_error',result.statusMessage);        
        } else if (result.statusCode===200) {

            if (result.json.hintCode) {
                switch(result.json.hintCode) {
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
                        return this._createErrorMessage('api_error', `Unknwon error '${result.json.hintCode}' was received`);
                }                
            } else {

                if (result.json.status==="complete") {

                    return this._createCompletionMessage(
                        result.json.completionData.user.personalNumber,
                        result.json.completionData.user.givenName,
                        result.json.completionData.user.surname,
                        result.json.completionData.user.name, {
                            signature: result.json.completionData.signature,
                            ocspResponse: result.json.completionData.ocspResponse       
                        }); 

                } else {
                    return this._createErrorMessage('communication_error', result.data);
                }

            }

        } else {
            if (result.json.errorCode) {
                switch(result.json.errorCode)  {
                    case 'invalidParameters':                       
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error '${result.json.errorCode}' was received`);
                }
            } else {
                return this._createErrorMessage('communication_error',result.statusMessage);
            }
        }

    }

    async cancelRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');
        
        var postData = {
            orderRef: data.id
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

    createQRCodeString(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.qrStartSecret||!data.qrStartToken||!data.qrAuthTime) this._createErrorMessage('internal_error','Needed attributes not supplied');
        var initTime = (new Date(data.qrAuthTime)).getTime();
        var currTime = (new Date()).getTime();
        var timeDiff = Math.floor((currTime - initTime) / 1000);
        var hash = crypto.createHmac('SHA256', data.qrStartSecret).update(timeDiff.toString()).digest("hex");
        return `bankid.${data.qrStartToken}.${timeDiff}.${hash}`;
    }

    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id) return this._createErrorMessage('internal_error','Id argument must be string');
        var postData = '';
        var endpointUri = '';

        if (data.text) {
            endpointUri = 'sign';
            postData = {
                endUserIp: data.endUserIp ? data.endUserUp : '127.0.0.1',
                userVisibleData: Buffer.from(data.text).toString('base64'),
                requirement: {
                    allowFingerprint: data.allowFingerprint ? data.allowFingerprint : this.settings.allowFingerprint
            }};
        } else {
            endpointUri = 'auth';
            postData = {
                endUserIp: data.endUserIp ? data.endUserUp : '127.0.0.1',
                requirement: {
                    allowFingerprint: data.allowFingerprint ? data.allowFingerprint : this.settings.allowFingerprint
            }};
        }

        var personalId = this._unPack(data.id);
        if (personalId) postData.personalNumber = personalId;

        var result = await this._httpRequest(`${this.settings.endpoint}/${endpointUri}`,{},JSON.stringify(postData));

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            if (result.json.qrStartSecret) {
                return this._createInitializationMessage(result.json.orderRef, {
                    autostart_token: result.json.autoStartToken,
                    autostart_url: "bankid:///?autostarttoken="+result.json.autoStartToken+"&redirect=null",
                    qrStartSecret: result.json.qrStartSecret,
                    qrStartToken: result.json.qrStartToken,
                    qrAuthTime: Date(),
                    qrCodeString: createQRCodeString
                });    
            } else {
                return this._createInitializationMessage(result.json.orderRef, {
                    autostart_token: result.json.autoStartToken,
                    autostart_url: "bankid:///?autostarttoken="+result.json.autoStartToken+"&redirect=null"
                });
            }


        } else {

            if (result.json.errorCode) {
                switch(result.json.errorCode)  {
                    case 'invalidParameters':                       
                        if (result.json.details==='Incorrect personalNumber') {
                            return this._createErrorMessage('request_ssn_invalid');
                        } else if (result.json.details==='Invalid userVisibleData') {
                            return this._createErrorMessage('request_text_invalid');
                        } else {
                            return this._createErrorMessage('api_error', `Unknwon parameter error '${result.json.details}' was received`);
                        }                    
                    case 'alreadyInProgress':
                        return this._createErrorMessage('already_in_progress');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error '${result.json.errorCode}' was received`);
                }
            } else {
                return this._createErrorMessage('communication_error',result.statusMessage);
            }

        };
        
    }

    // Supporting function to take care of any and all types of id that could be sent into bankid
    _unPack(data) {
        if (data==="") return "";
        if (data==="INFERRED") return "";

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