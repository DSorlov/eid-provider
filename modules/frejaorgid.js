const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const jwt = require('jsonwebtoken');

const defaultSettings = {
    production: {
        endpoint: 'https://services.prod.frejaeid.com',
        client_cert: '',
        ca_cert: fs.readFileSync(__dirname +`/../certs/frejaeid_prod.ca`),
        jwt_cert: {
            'aRw9OLn2BhM7hxoc458cIXHfezw': fs.readFileSync(__dirname +`/../certs/frejaeid_prod_aRw9OLn2BhM7hxoc458cIXHfezw.jwt`),
            'onjnxVgI3oUzWQMLciD7sQZ4mqM': fs.readFileSync(__dirname +`/../certs/frejaeid_prod_onjnxVgI3oUzWQMLciD7sQZ4mqM.jwt`)
        },
        password: '',
        default_country: 'SE',
        minimumLevel: 'EXTENDED',
        id_type: 'ORG_ID',
        attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'       
    },
    testing: {
        endpoint: 'https://services.test.frejaeid.com',
        client_cert: fs.readFileSync(__dirname +'/../certs/frejaeid_test.pfx'),
        ca_cert: fs.readFileSync(__dirname +`/../certs/frejaeid_test.ca`),
        jwt_cert: {
            '2LQIrINOzwWAVDhoYybqUcXXmVs': fs.readFileSync(__dirname +`/../certs/frejaeid_test_2LQIrINOzwWAVDhoYybqUcXXmVs.jwt`),
            'HwMHK_gb3_iuNF1advMtlG0-fUs': fs.readFileSync(__dirname +`/../certs/frejaeid_test_HwMHK_gb3_iuNF1advMtlG0-fUs.jwt`)
        },
        password: 'test',
        default_country: 'SE',
        minimumLevel: 'EXTENDED',
        id_type: 'ORG_ID',
        attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'       
    }        
}

var settings = undefined;
var axios = undefined; 

// Lets set some default values for this circus
function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.settings.attribute_list = this.settings.attribute_list + ",ORGANISATION_ID_IDENTIFIER";
    this.axios = axioslibrary.create({
        httpsAgent: new https.Agent({
          pfx: settings.client_cert,
          passphrase: settings.password,
          ca: settings.ca_cert
        }),     
        headers: {
          'Content-Type': 'application/json',
        },
    });
}

function unPack(default_type,default_country,data) {

    if (typeof data === 'string') {
        return { 
            userInfoType: default_type,
            userInfo: default_type==='SSN' ? Buffer.from(JSON.stringify({country: default_country,ssn: data})).toString('base64') : data
        }            
    } else {
        var value = data.toString();
        var country = default_country;
        if (data.type === 'EMAIL' || data.type === 'SSN' || data.type === 'PHONE' || data.type === 'ORG_ID') default_type = data.type;
        if (data.country === 'SE' || data.country === 'FI' || data.country === 'DK' || data.country === 'NO') country = data.country;
        if (data[default_type.toLowerCase()]) value = data[default_type.toLowerCase()];

        return { 
                userInfoType: default_type,
                userInfo: default_type==='SSN' ? Buffer.from(JSON.stringify({country: default_country,ssn: value})).toString('base64') : value
        } 
    }
}

// Lets structure a call for a auth request and return the worker
async function initAuthRequest(id) {
    var infoType = unPack(this.settings.id_type,this.settings.default_country,id);
    return await initRequest(this,'organisation/authentication/1.0/init', "initAuthRequest="+Buffer.from(JSON.stringify({
        attributesToReturn: this.settings.attribute_list.split(","),
        minRegistrationLevel: this.settings.minimumLevel,
        userInfoType: infoType.userInfoType,
        userInfo: infoType.userInfo
        })).toString('base64')
    );
}

// Lets structure a call for a sign request and return the worker
async function initSignRequest(id,text) {
    var infoType = unPack(this.settings.id_type,this.settings.default_country,id);
    return await initRequest(this,'organisation/sign/1.0/init', "initSignRequest="+Buffer.from(JSON.stringify({
        attributesToReturn: this.settings.attribute_list.split(","),
        minRegistrationLevel: this.settings.minimumLevel,
        userInfoType: infoType.userInfoType,
        signatureType: 'SIMPLE',
        dataToSignType: 'SIMPLE_UTF8_TEXT',
        dataToSign: { text: Buffer.from(text).toString('base64') },
        userInfo: infoType.userInfo
        })).toString('base64')
    );
}

// Lets structure do speciall stuff
async function initAddOrgIdRequest(id, title, attribute, value) {
    var infoType = unPack(this.settings.id_type,this.settings.default_country,id);

    return await initRequest(this,'organisation/management/orgId/1.0/initAdd', "initAddOrganisationIdRequest="+Buffer.from(JSON.stringify({
        userInfoType: infoType.userInfoType,
        userInfo: infoType.userInfo,    
        organisationId: {
            title: title,
            identifierName: attribute,
            identifier: value
        },
    })).toString('base64')
    );
}


async function initRequest(self,endpoint,data) {
    const [error, response] = await to(self.axios.post(`${self.settings.endpoint}/${endpoint}`,data));

    var result = error ? error.response : response;    

    // Check if we get a success message or a failure (http) from the api, return standard response structure
    if(!error) {

        var refId = undefined;
        if (result.data.authRef) refId = result.data.authRef;
        if (result.data.signRef) refId = result.data.signRef;
        if (result.data.orgIdRef) refId = result.data.orgIdRef;

        return {status: 'initialized', id: refId, extra: {
            autostart_token: refId,
            autostart_url: "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(refId)
        } };
    } else {
        if (!result.response && result.isAxiosError) {
            return {status: 'error', code: 'system_error', description: error.code, details: error.message}
        }

        if (result.data.code) {
            switch(result.data.code)  {
                case 1004:
                    return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Permission denied'};
                case 1012:
                    return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Not found'};
                case 1005: 
                    return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Blocked application'};
                case 2000:
                    return {status: 'error', code: 'already_in_progress', description: 'A transaction was already pending for this SSN'};
                case 1002:
                        return {status: 'error', code: 'request_ssn_invalid', description: 'The supplied SSN is not valid'};
                default:
                    return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data.message};
                }
        } else {
            return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
        }

    }

}

// Check the status of an existing auth request
async function pollAuthStatus(id,self=this) {
    return pollStatus(self,'organisation/authentication/1.0/getOneResult',"getOneAuthResultRequest="+Buffer.from(JSON.stringify({
        authRef: id
    })).toString('base64'))
}

// Check the status of an existing sign request
async function pollSignStatus(id,self=this) {
    return pollStatus(self,'organisation/sign/1.0/getOneResult',"getOneSignResultRequest="+Buffer.from(JSON.stringify({
        signRef: id
    })).toString('base64'))
}

async function pollAddOrgIdStatus(id,self=this) {
    return pollStatus(self,'organisation/management/orgId/1.0/getOneResult',"getOneOrganisationIdResultRequest="+Buffer.from(JSON.stringify({
        orgIdRef: id
    })).toString('base64'))
}

// Check the status of an existing request
async function pollStatus(self,endpoint,data) {
    const [error, response] = await to(self.axios.post(`${self.settings.endpoint}/${endpoint}`,data));

    var result = error ? error.response : response;

    if (!result.response && result.isAxiosError) {
        return {status: 'error', code: 'system_error', description: error.code, details: error.message}
    }

    if (result.data.code)
    {
        switch(result.data.code) {
            case 1012:
                return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Not found'};
            case 1005: 
                return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Blocked application'};
            case 2000:
                return {status: 'error', code: 'already_in_progress', description: 'A transaction was already pending for this SSN'};
            case 1002:
                return {status: 'error', code: 'request_ssn_invalid', description: 'The supplied SSN is not valid'};
            case 1100:
                return {status: 'error', code: 'request_id_invalid', description: 'The supplied request cannot be found'};
            default:
                return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
        }
    }else {
        switch(result.data.status)
        {
            case "STARTED":
                return {status: 'pending', code: 'pending_notdelivered', description: 'The transaction has not initialized yet'};
            case "DELIVERED_TO_MOBILE":
                return {status: 'pending', code: 'pending_user_in_app', description: 'User have started the app'};
            case "CANCELED":
            case "REJECTED":
                return {status: 'error', code: 'cancelled_by_user', description: 'The user declined the transaction'};
            case "EXPIRED":
                return {status: 'error', code: 'expired_transaction', description: 'The transaction was not completed in time'};
            case "RP_CANCELED":
                return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request'};
            case "APPROVED":

                try {
                    //Trying to be efficient and reuse our userInfo object we sent in
                    //Make sure the data we got is signed and fail if verification fails
                    var jwtInfo = jwt.decode(result.data.details, { complete: true });
                    var decoded = jwt.verify(result.data.details, self.settings.jwt_cert[jwtInfo.header.x5t]);
                } catch(err) {
                    return {status: 'error', code: 'api_error', description: 'The signature integrity validation failed'};
                }

                if (!result.data.requestedAttributes) {
                    var userInfo = JSON.parse(decoded.userInfo);
                    return {
                        status: 'created',
                        jwt_token: result.data.details,
                    }
                } else {

                    var result = {
                        status: 'completed', 
                        user: {
                            id: result.data.requestedAttributes.organisationIdIdentifier,
                            firstname: '',
                            lastname: '',
                            fullname: ''
                        },
                        extra: {
                            jwt_token: result.data.details,
                        }};  
                        
                    if (decoded.requestedAttributes.dateOfBirth) result.extra.date_of_birth = decoded.requestedAttributes.dateOfBirth;
                    if (decoded.requestedAttributes.emailAddress) result.extra.primary_email = decoded.requestedAttributes.emailAddress;
                    if (decoded.requestedAttributes.allEmailAddresses) result.extra.email_addresses = decoded.requestedAttributes.allEmailAddresses;
                    if (decoded.requestedAttributes.addresses) result.extra.addresses = decoded.requestedAttributes.addresses;

                    if (decoded.requestedAttributes.basicUserInfo) {
                        result.user.firstname = decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.name : '',
                        result.user.lastname =  decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.surname : '',
                        result.user.fullname = decoded.requestedAttributes.basicUserInfo ? decoded.requestedAttributes.basicUserInfo.name+' '+decoded.requestedAttributes.basicUserInfo.surname : ''
                    }

                    if (decoded.requestedAttributes.ssn) {
                        result.extra.ssn_number = decoded.requestedAttributes.ssn.ssn;
                        result.extra.ssn_country = decoded.requestedAttributes.ssn.country;
                    }

                    return result;
                }

            default:
                return {status: 'error', code: 'api_error', description: 'An unknown error occured', details: result.data};
        }    
    }
}

// Lets structure a call for a auth request and return the worker
async function authRequest(ssn, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initAuthRequest(ssn);
    return await followRequest(this,'auth',initresp,initcallback,statuscallback);
}

// Lets structure a call for a sign request and return the worker
async function signRequest(ssn, text, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initSignRequest(ssn,text);
    return await followRequest(this,'sign',initresp,initcallback,statuscallback);
}

async function addOrgIdRequest(ssn, title, attribute, value, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initAddOrgIdRequest(ssn,title,attribute,value);
    return await followRequest(this,'add',initresp,initcallback,statuscallback);
}

// Start a authRequest and wait for completion
// Callback will be called as long as we are pending definite answer
async function followRequest(self, pollMethod, initresp, initcallback=undefined, statuscallback=undefined) {
      
    // Since the initAuthRequest will be polite and never throw, we have
    // to check for a error in this more civil way. Return if error.
    // could do some additional processing here if needed
    if (initresp.status==='error') {
        return initresp;
    }

    // Let the caller know we are starting work
    if (initcallback) { initcallback(initresp); }

    // Do the loop thing
    while (true) {

        // Retreive current status
        var error, pollresp  = undefined;
        if (pollMethod=='auth') [error, pollresp] = await to(self.pollAuthStatus(initresp.id,self));
        if (pollMethod=='sign') [error, pollresp] = await to(self.pollSignStatus(initresp.id,self));
        if (pollMethod=='add') [error, pollresp] = await to(self.pollAddOrgIdStatus(initresp.id,self));
        
        if (error) {
            return {status: 'error', code: 'system_error', description: 'Internal module error', details: error.message}
        }

        // Check if we we have a definite answer
        if (pollresp.status==='completed'||pollresp.status==='error'||pollresp.status==='created') { return pollresp; }

        // Ok, no definite answer yet, check if we have a callback to do and perform that
        if (statuscallback) { statuscallback(pollresp); }

        // APIs impose a rate limit so lets wait two seconds before we try again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Lets cancel pending requests, dont really care about the results here
async function cancelAuthRequest(id) {
      await to(this.axios.post(`${this.settings.endpoint}/organisation/authentication/1.0/cancel`, 
        "cancelAuthRequest="+Buffer.from(JSON.stringify({
            authRef: id
        })).toString('base64')
    ));    
    return true;    
}

// Lets cancel pending requests, dont really care about the results here
async function cancelSignRequest(id) {
    await to(this.axios.post(`${this.settings.endpoint}/organisation/sign/1.0/cancel`, 
      "cancelSignRequest="+Buffer.from(JSON.stringify({
          signRef: id
      })).toString('base64')
  ));    
  return true;    
}

async function cancelAddOrgIdRequest(id) {
    await to(this.axios.post(`${this.settings.endpoint}/organisation/management/orgId/1.0/cancelAdd`, 
      "cancelAddOrganisationIdRequest="+Buffer.from(JSON.stringify({
          orgIdRef: id
      })).toString('base64')
  ));    
  return true;    
}

async function deleteOrgIdRequest(id) {
    const [error,response] = await to(this.axios.post(`${this.settings.endpoint}/organisation/management/orgId/1.0/delete`, 
      "deleteOrganisationIdRequest="+Buffer.from(JSON.stringify({
        identifier: id
      })).toString('base64')
  ));    

  var result = error ? error.response : response;

  if (!result.response && result.isAxiosError) {
    return {status: 'error', code: 'system_error', description: error.code, details: error.message}
    }

    if (result.data.code)
    {
        switch(result.data.code) {
            case 1008:
            case 1004:
                return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request', details: 'Permission denied'};
            case 4000:
            case 4001:
                    return {status: 'error', code: 'request_id_invalid', description: 'The supplied request cannot be found'};
            default:
                return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
        }
    } else {
        return { status: 'completed'};
    }
}



module.exports = {
    settings: defaultSettings,
    initialize: initialize,
    pollAuthStatus: pollAuthStatus,
    pollSignStatus: pollSignStatus,
    signRequest: signRequest,
    authRequest: authRequest,
    initAuthRequest: initAuthRequest,
    initSignRequest: initSignRequest,
    cancelSignRequest: cancelSignRequest,
    cancelAuthRequest: cancelAuthRequest,

    extras: {
        addOrgIdRequest: addOrgIdRequest,
        pollAddOrgIdStatus: pollAddOrgIdStatus,
        initAddOrgIdRequest: initAddOrgIdRequest,
        cancelAddOrgIdRequest: cancelAddOrgIdRequest,
        deleteOrgIdRequest: deleteOrgIdRequest
    }
}