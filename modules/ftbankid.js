const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const { v4: uuid } = require('uuid');
const request = require("request");
const soap = require("soap");

const defaultSettings = {
    production: {
        endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2?wsdl',
        ca_cert: fs.readFileSync(__dirname +`/../certs/ftbankid_prod.ca`),
        display_name: '',
        policy: ''
    },
    testing: {
        endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2?wsdl',
        ca_cert: fs.readFileSync(__dirname +`/../certs/ftbankid_test.ca`),
        display_name: 'test',
        policy: 'logtest020'
    }        
}

var settings = undefined;
var clientOptions = request.defaults();

function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.clientOptions = request.defaults({
        ca: this.settings.ca_cert
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

function createClient(self,uri,method,options) {
    // Setup params for the call
    var requestOptions = {
        policy: self.settings.policy,
        provider: 'bankid',
        rpDisplayName: self.settings.display_name,
        requirement: { certificatePolicies: ["1.2.752.78.1.5"]}
    };

    for(property in options)
    {
        requestOptions[property] = options[property];
    }

    // Make sure we accept any remote CA that is allowed
    var clientOptions = request.defaults({
        ca: self.settings.ca_cert
    });

    // Just return a promise and later resolve with the result of the transaction
    return new Promise(function(resolve, reject) {
        soap.createClient(
            self.settings.endpoint,
            { request: clientOptions, forceSoap12Headers: true },
            function(err, client) {
                //client.addHttpHeader("Content-Type", "application/soap+xml");
                //client.wsdl.xmlnsInHeader ='xmlns:wsa="http://www.w3.org/2005/08/addressing"';
                //client.addHttpHeader('<wsa:Action soap:mustUnderstand="1">http://mobilityguard.com/grp/service/v2.0/'+uri+'</wsa:Action>');
                //client.addHttpHeader('<wsa:MessageID soap:mustUnderstand="1">uuid:' + uuid() + "</wsa:MessageID>");
                var hejh=1;
                client[method](requestOptions, function(err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }
        );
    });

}

async function pollStatus(id,self=this) {

    if (id.length!=73) {
        return {status: 'error', code: 'request_id_invalid', description: 'The supplied request cannot be found'}; 
    }

    var orderRef = id.substring(37,73);
    var transactionId = id.substring(0,36);

    var [error,result] = await to(createClient(self,'GrpServicePortType/CollectRequest', 'Collect', {
        transactionId: transactionId,
        orderRef: orderRef
    }));

    if (error)
    {
        var regexp = /<S:Reason><S:Text xml:lang="en">(.*)<\/S:Text><\/S:Reason>.*<faultStatus>(.*)<\/faultStatus>.*<detailedDescription>(.*)<\/detailedDescription>/g;
        var matches = regexp.exec(error.response.body);

        if (matches.length!=4) {
            return {status: 'error', code: 'api_error', description: 'A communications error occured', details: "Parsing of remote error failed."};        
        }

        switch(matches[2]) {
            case 'USER_CANCEL':
                return {status: 'error', code: 'cancelled_by_user', description: 'The user declined transaction'};
            case 'EXPIRED_TRANSACTION':
                return {status: 'error', code: 'expired_transaction', description: 'The transaction was not completed in time'};
            case 'INVALID_PARAMETERS':
                if (matches[3]==='No such order') {
                    return {status: 'error', code: 'request_id_invalid', description: 'The supplied request cannot be found'};;
                } else {
                    return {status: 'error', code: 'api_error', description: 'A communications error occured', details: matches[4]};
                }
            default:
                return {status: 'error', code: 'api_error', description: 'A communications error occured', details: matches[4]};
        }
    }

    switch(result.progressStatus) {
        case "OUTSTANDING_TRANSACTION":
            return {status: 'pending', code: 'pending_notdelivered', description: 'The transaction has not initialized yet'};
        case "USER_SIGN":
            return {status: 'pending', code: 'pending_user_in_app', description: 'User have started the app'};
        case "NO_CLIENT":
            return {status: 'pending', code: 'pending_delivered', description: 'Delivered to mobile phone'};
        case "COMPLETE":
            return {
                status: 'completed', 
                user: {
                    id: result.userInfo.subjectIdentifier,
                    firstname: result.userInfo.givenName,
                    surname: result.userInfo.sn,
                    fullname: result.userInfo.displayName
                },
                extra: {
                    signature: result.validationInfo.signature,
                    ocspResponse: result.validationInfo.ocspResponse}
                };
        default:
            return {status: 'error', code: 'api_error', description: 'A communications error occured', details: result.data};
    }

    
}

// Lets set up the followRequest for a signing request
async function signRequest(ssn, text, initcallback=undefined, statuscallback=undefined) {
    var initresp = await this.initSignRequest(ssn, text);
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

        // Check if we we have a definite answer
        if (pollresp.status==='completed'||pollresp.status==='error') { return pollresp; }

        // Ok, no definite answer yet, check if we have a callback to do and perform that
        if (statuscallback) { statuscallback(pollresp); }

        // APIs impose a rate limit so lets wait two seconds before we try again
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function initSignRequest(ssn,text) {
    ssn = unPack(ssn);
    return await initRequest(this, 'GrpServicePortType/SignatureRequest', 'Sign', {
        transactionId: uuid(),
        subjectIdentifier: ssn,
        userVisibleData: Buffer.from(text).toString('base64')
    });
}

async function initAuthRequest(ssn) {
    ssn = unPack(ssn);
    return await initRequest(this, 'GrpServicePortType/AuthenticateRequest', 'Authenticate', {
        transactionId: uuid(),
        subjectIdentifier: ssn
    });
}

async function initRequest(self,service,method,data) {

    var [error,result] = await to(createClient(self,service, method, data));

    if (error)
    {
        var regexp = /<S:Reason><S:Text xml:lang="en">(.*)<\/S:Text><\/S:Reason>.*<faultStatus>(.*)<\/faultStatus>.*<detailedDescription>(.*)<\/detailedDescription>/g;
        var matches = regexp.exec(error.response.body);

        if (matches.length!=4) {
            return {status: 'error', code: 'api_error', description: 'A communications error occured', details: "Parsing of remote error failed."};        
        }

        switch(matches[2]) {
            case 'ALREADY_IN_PROGRESS':
                return {status: 'error', code: 'already_in_progress', description: 'A transaction was already pending for this SSN'};
            case 'INVALID_PARAMETERS':
                if (matches[3]==='Incorrect personalNumber') {
                    return {status: 'error', code: 'request_ssn_invalid', description: 'The supplied SSN is not valid'};
                } else if (matches[3]==='Invalid userVisibleData') {
                    return {status: 'error', code: 'request_text_invalid', description: 'The supplied agreement text is not valid'};
                } else {
                    return {status: 'error', code: 'api_error', description: 'A communications error occured', details: matches[4]};
                }
            default:
                return {status: 'error', code: 'api_error', description: 'A communications error occured', details: matches[4]};
        }
    }

    return {status: 'initialized', id: result.transactionId+"-"+result.orderRef, extra: {
        autostart_token: result.AutoStartToken,
        autostart_url: "bankid:///?autostarttoken="+result.AutoStartToken+"&redirect=null"
    }};

}

function cancelRequest() {
    //This method is actually not even used by Funktionstjanster.
    //We just return a emtpy response
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