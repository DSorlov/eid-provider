const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const { v4: uuid } = require('uuid');

const defaultSettings = {
    production: {
        endpoint: 'https://client.grandid.com/',
        servicekey: '',
        apikey: ''
    },
    testing: {
        endpoint: 'https://client.grandid.com/',
        servicekey: '',
        apikey: ''
    }        
}

var settings = undefined;
var axios = undefined; 
var client = undefined; 

function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.axios = axioslibrary.create({
        httpsAgent: new https.Agent(),     
        headers: {
          'Content-Type': 'application/json'
        }
    });    
    this.client = axioslibrary.create({
        httpsAgent: new https.Agent(),     
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json'
        }
    });    
}

function unPack(data) {
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

async function authRequest(ssn, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initAuthRequest(ssn);
    return await followRequest(this,initresp,initcallback,statuscallback);
}

// Start a authRequest and wait for completion
// Callback will be called as long as we are pending definite answer
async function followRequest(self, initresp, initcallback=undefined, statuscallback=undefined) {
      
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
        const [error, pollresp] = await to(self.pollAuthStatus(initresp.id,self)); 

        // Check if we we have a definite answer
        if (pollresp.status==='completed'||pollresp.status==='error') { return pollresp; }

        // Ok, no definite answer yet, check if we have a callback to do and perform that
        if (statuscallback) { statuscallback(pollresp); }

        // APIs impose a rate limit so lets wait two seconds before we try again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function pollAuthStatus(id,self=this) {

    var redirectUrl = Buffer.from(id, 'base64').toString('ascii');
    const [error, response] = await to(self.client.get(redirectUrl+"&poll=1"));

    if (error) {
        return {status: 'error', code: "api_error", description: 'A communications error occured', details: error.data};        
    }

    switch(response.data.status) {
        case "STARTED":
            return {status: 'pending', code: 'pending_notdelivered', description: 'The transaction has not initialized yet'};
        case "DELIVERED_TO_MOBILE":
            return {status: 'pending', code: 'pending_user_in_app', description: 'User have started the app'};
        case "CANCELLED":
        case "REJECTED":
            return {status: 'error', code: 'cancelled_by_user', description: 'The user declined the transaction'};
        case "EXPIRED":
            return {status: 'error', code: 'expired_transaction', description: 'The transaction was not completed in time'};
        case "RP_CANCELLED":
            return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request'};
        case "APPROVED":

            const [checkError, checkResponse] = await to(self.client.get(redirectUrl+"&done=1"));

            if (checkError) {
                return {status: 'error', code: "api_error", description: 'A communications error occured', details: checkError.data};        
            }

            return {
                status: 'completed', 
                user: {
                    ssn: checkResponse.data.userInfo.ssn,
                    firstname: checkResponse.data.requestedAttributes.basicUserInfo.name,
                    surname: checkResponse.data.requestedAttributes.basicUserInfo.surname,
                    fullname: checkResponse.data.requestedAttributes.basicUserInfo.name + ' ' + checkResponse.data.requestedAttributes.basicUserInfo.surname
                },
                extra: {
                    jwt_token: checkResponse.data.details
                }};                

        
        default:
            return {status: 'error', code: "api_error", description: 'A communications error occured', details: response.data};        
        }
}

async function initAuthRequest(ssn) {
    ssn = unPack(ssn);
    const [error, response] = await to(this.axios.post(`${this.settings.endpoint}json1.1/FederatedLogin?apiKey=${this.settings.apikey}&authenticateServiceKey=${this.settings.servicekey}`, {
        callbackUrl: "https://localhost/",
        personalNumber: ssn,
        pushNotification: "TGVnaXRpbWVyaW5nCg==",
        gui: false,
        thisDevice: false
    }));
    var result = error ? error.response : response;    

    // Check if we get a success message or a failure (http) from the api, return standard response structure
    if(!error) {
        var redirectUrl =  result.data.redirectUrl;
        const [error, response] = await to(this.client.post(redirectUrl+"&init=1",
            'frejaSubmit=Logga%20in&userIdentifier='+ssn
        ));
    
        if (error) {
            return {status: 'error', code: "api_error", description: 'A communications error occured', details: error.data};        
        }

        return {status: 'initialized', id: Buffer.from(redirectUrl).toString('base64'), extra: {
            grandid_token: result.data.sessionId,
            autostart_token: response.data.token,
            autostart_url: "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(response.data.token)
        }};
    } else {
        return {status: 'error', code: "api_error", description: 'A communications error occured', details: result.data};
    }

}

function notImplemented() {
    throw('Method not implemented (see https://github.com/DSorlov/eid-provider/docs/gfrejaeid.md)');
}

function cancelRequest() {
    //Not used in "workaround mode"
    return true;
}

module.exports = {
    settings: defaultSettings,
    initialize: initialize,
    pollAuthStatus: pollAuthStatus,
    pollSignStatus: notImplemented,
    signRequest: notImplemented,
    authRequest: authRequest,
    initAuthRequest: initAuthRequest,
    initSignRequest: notImplemented,
    cancelSignRequest: notImplemented,
    cancelAuthRequest: cancelRequest
}