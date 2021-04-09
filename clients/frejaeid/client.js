const BaseClient = require('../baseclient.js');
const jwt = require('jsonwebtoken');

class FrejaEID extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};

        this.clientInfo = {        
            name: "FrejaEID",
            version: "20210408",
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

    async initSignRequest(id, title, attribute, value) {
        return await this.initRequest({id: id, orgid: { title: title, name: attribute, value: value }});
    }

    async addOrgIdRequest(id, title, attribute, value, initCallback=undefined, statusCallback=undefined) {
        var doArgs = {
            id: id,
            orgid: {
                title: title,
                name: attribute,
                value: value
            }
        }
        if (initCallback) doArgs.initCallback = initCallback;
        if (statusCallback) doArgs.statusCallback = statusCallback;
        return await this.doRequest(doArgs);
    }
    async cancelAddOrgIdRequest(id)  {
        return await this.cancelRequest({id: id});
    }

    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var requestType = data.id.charAt(0);
        var requestId = data.id.substring(1);
        var requestUri = '';
        var requestData = '';

        if (requestType==="A") {
            requestData = "getOneAuthResultRequest="+Buffer.from(JSON.stringify({
                authRef: requestId
            })).toString('base64');
            requestUri = 'authentication/1.0/getOneResult';
        } else if (requestType==="S") {
            requestData = "getOneSignResultRequest="+Buffer.from(JSON.stringify({
                signRef: requestId
            })).toString('base64');
            requestUri = 'sign/1.0/getOneResult';
        } else if (requestType==="O") {
            requestData = "getOneOrganisationIdResultRequest="+Buffer.from(JSON.stringify({
                orgIdRef: requestId
            })).toString('base64');
            requestUri = 'organisation/management/orgId/1.0/getOneResult';
        } else {
            this._createErrorMessage('request_id_invalid');
        }    

        var result = await this._httpRequest(`${this.settings.endpoint}/${requestUri}`,{},requestData);

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            if (result.json.code) {
                switch(result.json.code) {
                    case 1004:
                        return this._createErrorMessage('api_error', 'Access to the service is denied.');
                    case 1008:
                        return this._createErrorMessage('api_error', 'Unknown relying party');
                    case 1100:
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error ${result.json.code} was received`);
                }
            } else {
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
                    case "RP_CANCELED":
                        return this._createErrorMessage('cancelled_by_idp');
                    case "APPROVED":

                        try {
                            //Trying to be efficient and reuse our userInfo object we sent in
                            //Make sure the data we got is signed and fail if verification fails
                            var jwtInfo = jwt.decode(result.json.details, { complete: true });
                            var decoded = jwt.verify(result.json.details, this.settings.jwt_cert[jwtInfo.header.x5t]);
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
                            jwt_token: result.json.details
                        };

                        if (decoded.requestedAttributes.dateOfBirth) extras.date_of_birth = decoded.requestedAttributes.dateOfBirth;
                        if (decoded.requestedAttributes.emailAddress) extras.primary_email = decoded.requestedAttributes.emailAddress;
                        if (decoded.requestedAttributes.allEmailAddresses) extras.email_addresses = decoded.requestedAttributes.allEmailAddresses;
                        if (decoded.requestedAttributes.allPhoneNumbers) extras.phone_numbers = decoded.requestedAttributes.allPhoneNumbers;
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
                        return this._createErrorMessage('api_error', `Unknwon status '${result.json.status}' was received`);
                }
            }

        } else {

            return this._createErrorMessage('communication_error',result.statusMessage);

        }
    }

    async cancelRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var requestType = data.id.charAt(0);
        var requestId = data.id.substring(1);

        if (requestType==="A") {
            var postData = "cancelAuthRequest="+Buffer.from(JSON.stringify({
                authRef: requestId
            })).toString('base64');
            return await this._simpleRequest('authentication/1.0/cancel', postData);
        } else if (requestType==="S") {
            var postData = "cancelSignRequest="+Buffer.from(JSON.stringify({
                signRef: requestId
            })).toString('base64');
            return await this._simpleRequest('sign/1.0/cancel', postData);
        } else if (requestType==="O") {
            var postData = "cancelSignRequest="+Buffer.from(JSON.stringify({
                orgIdRef: requestId
            })).toString('base64');
            return await this._simpleRequest('organisation/management/orgId/1.0/cancelAdd', postData);            
        } else {
            this._createErrorMessage('request_id_invalid');
        }       
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
    
    async getOrgIdList() {    
        var result = await this._httpRequest(`${this.settings.endpoint}/organisation/management/orgId/1.0/users/getAll`,{},'{}');

        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            return this._createSuccessMessage(result.json.userInfos);
        } else {
            return this._createErrorMessage('communication_error',result.statusMessage);
        }
    }

    async deleteOrgIdRequest(id) {
        var postData = "deleteOrganisationIdRequest="+Buffer.from(JSON.stringify({
            identifier: id
          })).toString('base64');    
        var result = await this._httpRequest(`${this.settings.endpoint}/organisation/management/orgId/1.0/delete`,{},postData);
    
        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            
            if (result.json.code)
            {
                switch(result.json.code) {
                    case 1008:
                    case 1004:
                        return this._createErrorMessage('api_error','Access denied');
                    case 4000:
                    case 4001:
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', `Unknwon error ${result.json.code} was received`);
                }
            } else {
                return this._createSuccessMessage();
            }            
        } else {
            return this._createErrorMessage('communication_error',result.statusMessage);
        }
    }    

    // Authentication Initialization Request
    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var infoType = this._unPack(data.id);
        var postData = '';
        var requestUri = '';
        var requstType = '';

        if (data.orgid) {
            if (typeof data.orgid !== 'object') return this._createErrorMessage('internal_error','Supplied orgid argument is not a class');
            if (!data.orgid.title||!data.orgid.name||!data.orgid.value) return this._createErrorMessage('internal_error','Orgid must contain title,name and value as string')
            requestUri = 'organisation/management/orgId/1.0/initAdd';
            postData = "initAddOrganisationIdRequest="+Buffer.from(JSON.stringify({
                userInfoType: infoType.userInfoType,
                userInfo: infoType.userInfo,    
                organisationId: {
                    title: data.orgid.title,
                    identifierName: data.orgid.name,
                    identifier: data.orgid.value
                },
            })).toString('base64');  
            requstType = "O"; 
        } else if (data.text) {
            requestUri = 'sign/1.0/initSignature';
            postData = "initSignRequest="+Buffer.from(JSON.stringify({
                attributesToReturn: this.settings.attribute_list,
                minRegistrationLevel: this.settings.minimumLevel,
                userInfoType: infoType.userInfoType,
                userInfo: infoType.userInfo,
                signatureType: 'SIMPLE',
                dataToSignType: 'SIMPLE_UTF8_TEXT',
                dataToSign: { text: Buffer.from(data.text).toString('base64') }
            })).toString('base64');   
            requstType = "S"; 
        } else {
            requestUri = 'authentication/1.0/initAuthentication';
            postData = "initAuthRequest="+Buffer.from(JSON.stringify({
                attributesToReturn: this.settings.attribute_list,
                minRegistrationLevel: this.settings.minimumLevel,
                userInfoType: infoType.userInfoType,
                userInfo: infoType.userInfo
            })).toString('base64');   
            requstType = "A"; 
        }
        
        var result = await this._httpRequest(`${this.settings.endpoint}/${requestUri}`,{},postData);

        if (result.statusCode===599) {
            
            return this._createErrorMessage('internal_error',result.statusMessage);

        } else if (result.statusCode===200) {

            var token = `${requstType}${result.json.authRef||result.json.signRef||result.json.orgIdRef}`;
            return this._createInitializationMessage(token, {
                autostart_token: token,
                autostart_url: "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(result.json.signRef)
            });

        } else {

            if (result.json.code) {
                switch(result.json.code)  {
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
                        return this._createErrorMessage('api_error', `Unknwon error ${result.json.code} was received`);
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
            var infoValue = data.toString();
            var infoCountry = this.settings.default_country;
            var infoType = this.settings.id_type;

            if (data.type === 'EMAIL' || data.type === 'SSN' || data.type === 'PHONE' || data.type === 'INFERRED') infoType = data.type;
            if (data.country === 'SE' || data.country === 'FI' || data.country === 'DK' || data.country === 'NO') infoCountry = data.country;
            if (data[infoType.toLowerCase()]) infoValue = data[infoType.toLowerCase()];
    
            return { 
                    userInfoType: infoType,
                    userInfo: infoType==='SSN' ? Buffer.from(JSON.stringify({country: infoCountry,ssn: infoValue})).toString('base64') : infoValue
            } 
        }
    }    

}

module.exports = FrejaEID;