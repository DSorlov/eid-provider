const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;

const defaultSettings = {
    production: {
        endpoint: 'https://api.idkollen.se/v2',
        key: '',
        webhookkey: ''
    },
    testing: {
        endpoint: 'https://stgapi.idkollen.se/v2',
        key: '',
        webhookkey: ''
    }        
}

var settings = undefined;
var axios = undefined; 
 
// Lets set some default values for this circus
function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.axios = axioslibrary.create({
        httpsAgent: new https.Agent(),
        headers: {
          'Content-Type': 'application/json',
        },
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

// Check the status of an existing request
async function pollStatus(id,self=this) {

    var webhookId = id.substring(37,73);
    var orderRef = id.substring(0,36);

    // Check the transaction via API
    const [error, response] = await to(self.axios.get(`https://webhook.site/token/${webhookId}/request/latest/raw`, {}));
    

    // Since the API is returning error on pending, we consolidate and handle
    // it further down
    var result = error ? error.response : response;

    if (error && result.status==404) {
        return {status: 'pending', code: 'pending_delivered', description: 'Delivered to mobile phone'};
    }

    // Delete our temporary hook
    var webhook_data = { data: { } };
    if (self.settings.webhookkey!=='') {
        webhook_data.headers = {
            'Api-Key': self.settings.webhookkey
        }
    }
    await to(self.axios.delete(`https://webhook.site/token/${webhookId}`));

    if (result.message) {
            return {status: 'error', code: 'system_error', description: error.status, details: error.message}
    }

    // We should actually only get here if we complete but lets handle the unlikely
    if (result.data.result==="completed") {
        return {
            status: 'completed', 
            user: {
                id: result.data.pno,
                firstname: '',
                surname: '',
                fullname: result.data.name
            },
            extra: {
                checksum: result.data.checksum}
            };
    } else {
        //This will never happen. Or it should not. Probably gonna happen.
        return {status: 'error', code: 'cancelled_by_idp', description: 'The IdP have cancelled the request'};
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
        const [error, pollresp] = await to(pollStatus(initresp.id,self));

        if (error) {
            return {status: 'error', code: 'system_error', description: 'Internal module error', details: error.message}
        }

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
    ssn = unPack(ssn);
    return await initRequest(this,'auth', {
        ipAddress: '127.0.0.1',
        pno: ssn,
        callbackUrl: 'https://webhook.site/'
    });
}

// Lets structure a call for a sign request and return the worker
async function initSignRequest(ssn,text) {
    ssn = unPack(ssn);
    return await initRequest(this,'sign', {
        endUserIp: '127.0.0.1',
        pno: ssn,
        message: text,
        callbackUrl: 'https://webhook.site/'
    });
}

// Initialize and imediatly return with the id of the request
async function initRequest(self,endpoint,data) {

    // Create a temporary webhook to catch the response
    // The IDKollen API is sadly a callback API so workaround is needed.

    var webhook_postdata = { data: {
        default_status: 200,
        default_content: "Ok",
        default_content_type: "text/html",
        timeout: 0,
        cors: false,
        expiry: true
    } };
    if (self.settings.webhookkey!=='') {
        webhook_postdata.headers = {
            'Api-Key': self.settings.webhookkey
        }
    }

    const [webhook_error, webhook_response] = await to(self.axios.post(`https://webhook.site/token`, webhook_postdata));

    // Make sure we generated a URI before continuing
    if(webhook_error) {
        return {status: 'error', code: 'system_error', description: webhook_error.code, details: error.message}
    }  
    var responseUiid = webhook_response.data.uuid;
    data.callbackUrl = data.callbackUrl + responseUiid;

    // Call BankID. We are using a fake remote address as most APIs do not have this
    const [error, response] = await to(self.axios.post(`${self.settings.endpoint}/${self.settings.key}/${endpoint}`, data));
      
    // Since the API is returning error on pending, we consolidate and handle
    // it further down
    var result = error ? error.response : response;    

    // Check if we get a success message or a failure (http) from the api, return standard response structure
    if(!error) {
        return {status: 'initialized', id: result.data.orderRef+'-'+responseUiid, extra: {
            autostart_token: result.data.autoStartToken,
            autostart_url: "bankid:///?autostarttoken="+result.data.autoStartToken+"&redirect=null"
        }};
    } else {
        if (!error.response && error.isAxiosError) {
            return {status: 'error', code: 'system_error', description: error.code, details: error.message}
        }

        if (result.data.message) {
            switch(result.data.message)  {
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

        var webhookId = id.substring(37,73);
        var orderRef = id.substring(0,36);

        var webhook_data = { data: { } };
        if (self.settings.webhookkey!=='') {
            webhook_data.headers = {
                'Api-Key': self.settings.webhookkey
            }
        }

        await to(this.axios.delete(`https://webhook.site/token/${webhookId}`, webhook_data));
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