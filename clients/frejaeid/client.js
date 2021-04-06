const BaseClient = require('../baseclient.js');
const jwt = require('jsonwebtoken');

class FrejaEID extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};

        this.clientInfo = {        
            name: "FrejaEID",
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
        var postData = "getOneAuthResultRequest="+Buffer.from(JSON.stringify({
            authRef: id
        })).toString('base64');
        return this._pollRequest('authentication/1.0/getOneResult', postData);
    }

    async pollSignRequest(id) {
        var postData = "getOneSignResultRequest="+Buffer.from(JSON.stringify({
            signRef: id
        })).toString('base64');
        return this._pollRequest('sign/1.0/getOneResult', postData);
    }

    async _pollRequest(uri,postData) {

        var result = await this._httpRequest(`${this.settings.endpoint}/${uri}`,{},postData);
        var resultData = result.data!=='' ? JSON.parse(result.data) : {};

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            if (resultData.code) {
                switch(resultData.code) {
                    case 1100:
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error ${resultData.code} was received`);
                }
            } else {
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
                    case "RP_CANCELED":
                        return this._createErrorMessage('cancelled_by_idp');
                    case "APPROVED":

                        try {
                            //Trying to be efficient and reuse our userInfo object we sent in
                            //Make sure the data we got is signed and fail if verification fails
                            var jwtInfo = jwt.decode(resultData.details, { complete: true });
                            var decoded = jwt.verify(resultData.details, this.settings.jwt_cert[jwtInfo.header.x5t]);
                            var userId = '';
                            if (decoded.userInfoType==="N/A") {
                                if (decoded.requestedAttributes.ssn) {
                                    userId = decoded.requestedAttributes.ssn.ssn;
                                } else if (decoded.requestedAttributes.emailAddress) {
                                    userId = decoded.requestedAttributes.emailAddress;
                                } else if (decoded.requestedAttributes.relyingPartyUserId) {
                                    userId = decoded.requestedAttributes.relyingPartyUserId;
                                } else {
                                    return this._createErrorMessage('api_error', 'Authentication successfull but no discriminatory identity found');
                                }
                            } else if (decoded.userInfoType==="SSN") {
                                var tempInfo = JSON.parse(decoded.userInfo)
                                userId = tempInfo.ssn;
                            } else {
                                userId = decoded.userInfo
                            }
                        } catch(err) {
                            
                            return this._createErrorMessage('validation_failed');
                        }
        
                        var firstname = '';
                        var lastname = '';
                        var fullname = '';
                        var id = userId;
                        var extras = {
                            jwt_token: resultData.details
                        };

                        if (decoded.requestedAttributes.dateOfBirth) extras.date_of_birth = decoded.requestedAttributes.dateOfBirth;
                        if (decoded.requestedAttributes.emailAddress) extras.primary_email = decoded.requestedAttributes.emailAddress;
                        if (decoded.requestedAttributes.allEmailAddresses) extras.email_addresses = decoded.requestedAttributes.allEmailAddresses;
                        if (decoded.requestedAttributes.addresses) extras.addresses = decoded.requestedAttributes.addresses;
                        if (decoded.requestedAttributes.customIdentifier) extras.custom_identifier = decoded.requestedAttributes.customIdentifier;

                        if (decoded.requestedAttributes.ssn) {
                            extras.ssn_number = decoded.requestedAttributes.ssn.ssn;
                            extras.ssn_country = decoded.requestedAttributes.ssn.country;
                        }

                        if (decoded.requestedAttributes.basicUserInfo) {
                            firstname = decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.name : '',
                            lastname =  decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.surname : '',
                            fullname = decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.name+' '+decoded.requestedAttributes.basicUserInfo.surname : ''
                        }


                        return this._createCompletionMessage(id,firstname,lastname,fullname,extras);       

                    default:
                        return this._createErrorMessage('api_error', `Unknwon status '${resultData.status}' was received`);
                }
            }

        } else {

            reject(this._createErrorMessage('communication_error',result.statusMessage));

        }
    }

    async cancelAuthRequest(id) {
        var postData = "cancelAuthRequest="+Buffer.from(JSON.stringify({
            authRef: id
        })).toString('base64');
        return await this._simpleRequest('authentication/1.0/cancel', postData);
    }

    async cancelSignRequest(id) {
        var postData = "cancelSignRequest="+Buffer.from(JSON.stringify({
            signRef: id
        })).toString('base64');
        return await this._simpleRequest('sign/1.0/cancel', postData);
    }    

    async createCustomIdentifier(id,customid) {
        var infoType = this._unPack(id);
        var postData = "setCustomIdentifierRequest="+Buffer.from(JSON.stringify({
            userInfoType: infoType.userInfoType,
            userInfo: infoType.userInfo,
            customIdentifier: customid
        })).toString('base64');
        return await this._simpleRequest('user/manage/1.0/setCustomIdentifier', postData);
    }      

    async deleteCustomIdentifier(customid) {
        var postData = "deleteCustomIdentifierRequest="+Buffer.from(JSON.stringify({
            customIdentifier: customid
          })).toString('base64');
        return await this._simpleRequest('user/manage/1.0/deleteCustomIdentifier', postData);
    }      

    async _simpleRequest(uri,data) {
        var result = await this._httpRequest(`${this.settings.endpoint}/${uri}`,{},postData);

        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            return this._createSuccessMessage();
        } else {
            return this._createErrorMessage('communication_error',result.statusMessage);
        }
    }       

    async initAuthRequest(id) {
        var infoType = this._unPack(id);
        var postData = "initAuthRequest="+Buffer.from(JSON.stringify({
            attributesToReturn: this.settings.attribute_list,
            minRegistrationLevel: this.settings.minimumLevel,
            userInfoType: infoType.userInfoType,
            userInfo: infoType.userInfo
        })).toString('base64');        
        return await this._initRequest('authentication/1.0/initAuthentication', 'auth', postData);
    }

    async initSignRequest(id,text) {
        var infoType = this._unPack(id);
        var postData = "initSignRequest="+Buffer.from(JSON.stringify({
            attributesToReturn: this.settings.attribute_list,
            minRegistrationLevel: this.settings.minimumLevel,
            userInfoType: infoType.userInfoType,
            userInfo: infoType.userInfo,
            signatureType: 'SIMPLE',
            dataToSignType: 'SIMPLE_UTF8_TEXT',
            dataToSign: { text: Buffer.from(text).toString('base64') }
        })).toString('base64');        
        return await this._initRequest('sign/1.0/initSignature', 'sign', postData);
    }  

    // Authentication Initialization Request
    async _initRequest(uri,method,postData) {

        var result = await this._httpRequest(`${this.settings.endpoint}/${uri}`,{},postData);
        var resultData = result.data!=='' ? JSON.parse(result.data) : {};

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            var token = method==='auth' ? resultData.authRef : resultData.authRef;
            return this._createInitializationMessage(token, {
                method: method,
                autostart_token: token,
                autostart_url: "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(resultData.signRef)
            });

        } else {

            if (resultData.code) {
                switch(resultData.code)  {
                    case 1012:
                        return this._createErrorMessage('cancelled_by_idp','Not Found');
                    case 1005: 
                        return this._createErrorMessage('cancelled_by_idp','Blocked application');
                    case 2000:
                        return this._createErrorMessage('already_in_progress');
                    case 1002:  
                        return this._createErrorMessage('request_ssn_invalid');
                    case 2003:
                        return this._createErrorMessage('cancelled_by_idp','No custom identifier');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error ${resultData.code} was received`);
                }
            } else {
                return this._createErrorMessage('communication_error',result.statusMessage);
            }

        };

    }

    // Supporting function to take care of any and all types of id that could be sent into frejaeid
    _unPack(data) {

        // If we have a simple string, assume it is of default type
        if (typeof data === 'string') {
            return { 
                userInfoType: this.settings.id_type,
                userInfo: this.settings.id_type==='SSN' ? Buffer.from(JSON.stringify({country: this.settings.default_country,ssn: data})).toString('base64') : data
            }            
        } else {
            var value = data.toString();
            var country = this.settings.default_country;
            if (data.type === 'EMAIL' || data.type === 'SSN' || data.type === 'PHONE' || data.type === 'INFERRED') this.settings.id_type = data.type;
            if (data.country === 'SE' || data.country === 'FI' || data.country === 'DK' || data.country === 'NO') country = data.country;
            if (data[this.settings.id_type.toLowerCase()]) value = data[this.settings.id_type.toLowerCase()];
    
            return { 
                    userInfoType: this.settings.id_type,
                    userInfo: this.settings.id_type==='SSN' ? Buffer.from(JSON.stringify({country: this.settings.default_country,ssn: value})).toString('base64') : value
            } 
        }
    }    

}

module.exports = FrejaEID;