const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const jwt = require('jsonwebtoken');

const defaultSettings = {
    production: {
        endpoint: 'https://services.prod.frejaeid.com',
        client_cert: '',
        ca_cert: fs.readFileSync(`./certs/bankid_prod.ca`),
        jwt_cert: fs.readFileSync(`./certs/frejaeid_prod.jwt`),
        minimumLevel: 'EXTENDED',
        password: '',
        default_country: 'SE'
    },
    testing: {
        endpoint: 'https://services.test.frejaeid.com',
        client_cert: fs.readFileSync('./certs/frejaeid_test.pfx'),
        ca_cert: fs.readFileSync(`./certs/frejaeid_test.ca`),
        jwt_cert: fs.readFileSync(`./certs/frejaeid_test.jwt`),
        minimumLevel: 'EXTENDED',
        password: 'test',
        default_country: 'SE'
    }        
}

var settings = undefined;
var axios = undefined; 

// Lets set some default values for this circus
function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.axios = axioslibrary.create({
        httpsAgent: new https.Agent({
          pfx: settings.client_cert,
          passphrase: settings.password,
          ca: settings.ca_cert,
        }),     
        headers: {
          'Content-Type': 'application/json',
        },
    });
}

function unPack(self,data) {
    if (typeof data === 'string') {
        return { ssn: data, country: self.settings.default_country };
    } else {
        return { ssn: data.ssn ? data.ssn : data.toString(), country: data.country ? data.country : self.settings.default_country};
    }
}


// Lets structure a call for a auth request and return the worker
async function initAuthRequest(ssn) {
    var ssn = unPack(this,ssn);
    return await initRequest(this,'authentication/1.0/initAuthentication', "initAuthRequest="+Buffer.from(JSON.stringify({
        attributesToReturn: ["EMAIL_ADDRESS", "RELYING_PARTY_USER_ID", "BASIC_USER_INFO"],
        minRegistrationLevel: this.settings.minimumLevel,
        userInfoType: "SSN",
        userInfo: Buffer.from(JSON.stringify({
            country: ssn.country,
            ssn: ssn.ssn
        })).toString('base64')
    })).toString('base64')
    );
}

// Lets structure a call for a sign request and return the worker
async function initSignRequest(ssn,text) {
    var ssn = unPack(this,ssn);
    return await initRequest(this,'sign/1.0/initSignature', "initSignRequest="+Buffer.from(JSON.stringify({
        attributesToReturn: ["EMAIL_ADDRESS", "RELYING_PARTY_USER_ID", "BASIC_USER_INFO"],
        minRegistrationLevel: this.settings.minimumLevel,
        userInfoType: "SSN",
        signatureType: 'SIMPLE',
        dataToSignType: 'SIMPLE_UTF8_TEXT',
        dataToSign: { text: Buffer.from(text).toString('base64') },
        userInfo: Buffer.from(JSON.stringify({
            country: ssn.country,
            ssn: ssn.ssn
        })).toString('base64')
    })).toString('base64')
    );
}

async function initRequest(self,endpoint,data) {
    const [error, response] = await to(self.axios.post(`${self.settings.endpoint}/${endpoint}`,data));

    var result = error ? error.response : response;    

    // Check if we get a success message or a failure (http) from the api, return standard response structure
    if(!error) {
        var refId = result.data.authRef ? result.data.authRef : result.data.signRef
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
    return pollStatus(self,'authentication/1.0/getOneResult',"getOneAuthResultRequest="+Buffer.from(JSON.stringify({
        authRef: id
    })).toString('base64'))
}

// Check the status of an existing sign request
async function pollSignStatus(id,self=this) {
    return pollStatus(self,'sign/1.0/getOneResult',"getOneSignResultRequest="+Buffer.from(JSON.stringify({
        signRef: id
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
                    var decoded = jwt.verify(result.data.details, self.settings.jwt_cert);
                    var userInfo = JSON.parse(decoded.userInfo);
                } catch(err) {
                    return {status: 'error', code: 'api_error', description: 'The signature integrity validation failed'};
                }

                return {
                    status: 'completed', 
                    user: {
                        ssn: userInfo.ssn,
                        firstname: result.data.requestedAttributes.basicUserInfo.name,
                        surname: result.data.requestedAttributes.basicUserInfo.surname,
                        fullname: result.data.requestedAttributes.basicUserInfo.name + ' ' + result.data.requestedAttributes.basicUserInfo.surname
                    },
                    extra: {
                        jwt_token: result.data.details
                    }};                
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

        const [error, pollresp] = pollMethod=='auth' ? await to(self.pollAuthStatus(initresp.id,self)) : await to(self.pollSignStatus(initresp.id,self)) 

        // Check if we we have a definite answer
        if (pollresp.status==='completed'||pollresp.status==='error') { return pollresp; }

        // Ok, no definite answer yet, check if we have a callback to do and perform that
        if (statuscallback) { statuscallback(pollresp); }

        // APIs impose a rate limit so lets wait two seconds before we try again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Lets cancel pending requests, dont really care about the results here
async function cancelAuthRequest(id) {
      await to(this.axios.post(`${this.settings.endpoint}/authentication/1.0/cancel`, 
        "cancelAuthRequest="+Buffer.from(JSON.stringify({
            authRef: id
        })).toString('base64')
    ));    
    return true;    
}

// Lets cancel pending requests, dont really care about the results here
async function cancelSignRequest(id) {
    await to(this.axios.post(`${this.settings.endpoint}/sign/1.0/cancel`, 
      "cancelSignRequest="+Buffer.from(JSON.stringify({
          signRef: id
      })).toString('base64')
  ));    
  return true;    
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
    cancelAuthRequest: cancelAuthRequest
}