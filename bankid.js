const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;

const defaultSettings = {
    production: {
        endpoint: 'https://appapi2.bankid.com/rp/v5',
        client_cert: '',
        ca_cert: fs.readFileSync(`./certs/bankid_prod.ca`),
        allowFingerprint: true,
        password: ''
    },
    testing: {
        endpoint: 'https://appapi2.test.bankid.com/rp/v5',
        client_cert: fs.readFileSync('./certs/bankid_test.pfx'),
        ca_cert: fs.readFileSync(`./certs/bankid_test.ca`),
        allowFingerprint: true,
        password: 'qwerty123'
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

// Check the status of an existing request
async function pollStatus(id) {

    // Check the transaction via API
    const [error, response] = await to(this.axios.post(`${this.settings.endpoint}/collect`, {
        orderRef: id
    }));

    // Since the API is returning error on pending, we consolidate and handle
    // it further down
    var result = error ? error.response : response;

    if (error) {
        if (result.data.errorCode) {
            switch(result.data.errorCode)  {
                case "invalidParameters":
                    return {status: 'error', code: 'request_id_invalid', description: 'The supplied request cannot be found'};
                default:
                    return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data.details};
            }
        } else {
            return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
        }    
    }

    // Check if a error exists (there is a hintCode in all error messages)
    if (result.data.hintCode) {
        switch(result.data.hintCode) {
            case "expiredTransaction":
                return {status: 'error', code: 'expired_transaction', description: 'The transaction was not completed in time'};
            case "outstandingTransaction":
                return {status: 'pending', code: 'pending_notdelivered', description: 'The transaction has not initialized yet'};
            case "userSign":
                return {status: 'pending', code: 'pending_user_in_app', description: 'User have started the app'};
            case "noClient":
                return {status: 'pending', code: 'pending_delivered', description: 'Delivered to mobile phone'};
            case "userCancel":
                return {status: 'error', code: 'cancelled_by_user', description: 'The user declined transaction'};
            case "cancelled":
                return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request'};
            default:
                return {status: result.data.status, code: 'api_error', description: 'A communications error occured', details: result.data.hintCode};
        }
    } else {
        // We should actually only get here if we complete but lets handle the unlikely
        if (result.data.status==="complete") {
            return {
                status: 'completed', 
                user: {
                    ssn: result.data.completionData.user.personalNumber,
                    firstname: result.data.completionData.user.givenName,
                    surname: result.data.completionData.user.surname,
                    fullname: result.data.completionData.user.name
                },
                extra: {
                    signature: result.data.completionData.signature,
                    ocspResponse: result.data.completionData.ocspResponse}
                };
        } else {
            //This will never happen. Or it should not. Probably gonna happen.
            return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data};
        }
    }
}

// Lets set up the followRequest for a singing request
async function signRequest(ssn, text, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initSignRequest(ssn,text);
    return await followRequest(this,initresp,initcallback,statuscallback);
}

// Lets set up the followRequest for a authentication request
async function authRequest(ssn, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initAuthRequest(ssn);
    return await followRequest(this,initresp,initcallback,statuscallback);
}

// Start a authRequest and wait for completion
// Callback will be called as long as we are pending definite answer
async function followRequest(self,initresp, initcallback=undefined, statuscallback=undefined) {
      
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
        const [error, pollresp] = await to(self.pollStatus(initresp.id));

        // Check if we we have a definite answer
        if (pollresp.status==='completed'||pollresp.status==='error') { return pollresp; }

        // Ok, no definite answer yet, check if we have a callback to do and perform that
        if (statuscallback) { statuscallback(pollresp); }

        // APIs impose a rate limit so lets wait two seconds before we try again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Lets structure a call for a auth request and return the worker
async function initAuthRequest(ssn) {
    return await initRequest(this,'auth', {
        endUserIp: '127.0.0.1',
        personalNumber: ssn,
        requirement: {
            allowFingerprint: this.settings.allowFingerprint
        }});
}

// Lets structure a call for a sign request and return the worker
async function initSignRequest(ssn,text) {
    return await initRequest(this,'sign', {
        endUserIp: '127.0.0.1',
        personalNumber: ssn,
        userVisibleData: Buffer.from(text).toString('base64'),
        requirement: {
            allowFingerprint: this.settings.allowFingerprint
        }});
}

// Initialize and imediatly return with the id of the request
async function initRequest(self,endpoint,data) {

    // Call BankID. We are using a fake remote address as most APIs do not have this
    const [error, response] = await to(self.axios.post(`${self.settings.endpoint}/${endpoint}`, data));
      
    // Since the API is returning error on pending, we consolidate and handle
    // it further down
    var result = error ? error.response : response;    

    // Check if we get a success message or a failure (http) from the api, return standard response structure
    if(!error) {
        return {status: 'initialized', id: result.data.orderRef, extra: { autostart_token: result.data.autoStartToken}};
    } else {
        if (result.data.errorCode) {
            switch(result.data.errorCode)  {
                case "alreadyInProgress":
                    return {status: 'error', code: 'already_in_progress', description: 'A transaction was already pending for this SSN'};
                case "invalidParameters":
                    if (result.data.details==='Incorrect personalNumber') {
                        return {status: 'error', code: 'request_ssn_invalid', description: 'The supplied SSN is not valid'};
                    } else if (result.data.details==='Invalid userVisibleData') {
                        return {status: 'error', code: 'request_text_invalid', description: 'The supplied agreement text is not valid'};
                    } else {
                        return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data.details};
                    }
                default:
                    return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data.details};
                }
        } else {
            return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
        }
    }
}

// Lets cancel pending requests, dont really care about the results here
async function cancelRequest(id) {
        await to(this.axios.post(`${this.settings.endpoint}/cancel`, {
            orderRef: id
        }));
        return true;            
}

module.exports = {
    settings: defaultSettings,
    initialize: initialize,
    pollAuthStatus: pollStatus,
    pollSignStatus: pollStatus,
    signRequest: signRequest,
    authRequest: authRequest,
    initAuthRequest: initAuthRequest,
    initSignRequest: initSignRequest,
    cancelSignRequest: cancelRequest,
    cancelAuthRequest: cancelRequest
}