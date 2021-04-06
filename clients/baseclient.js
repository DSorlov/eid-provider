const crypto = require("crypto");
const https = require('https');

class BaseClient {

    constructor(settings) {
        //Would this ever be needed?
        //this.settings = settings || {};
        this.clientType = "BaseClient";
        this.clientID = crypto.randomBytes(16).toString("hex");
        this.httpsAgent = false;
    }

    //Used to customise if needed the http-agent
    _customAgent(options) {
        this.httpsAgent = new https.Agent(options);
    }

    //Request Completion Messages
    _createCompletionMessage(userId,userFirstname,userLastname,userFullname,extras=undefined) {
        return {
            status: 'completed',
            user: {
                id: userId,
                firstname: userFirstname,
                lastname: userLastname,
                fullname: userFullname
            },
            extra: extras || {}
        }
    }

    //Request Error Messages
    _createErrorMessage(code,details=undefined) {

        var responseCodes = {
            'expired_transaction': 'The transaction was not completed in time',
            'cancelled_by_idp': 'The IdP have cancelled the request',
            'cancelled_by_user': 'The user declined transaction',
            'initialization_error': 'The IdP was unable to start session',
            'api_error': 'The IdP had a processing error',
            'internal_error': 'The library had a processing error',
            'communication_error': 'An communications error occured',
            'request_ssn_invalid': 'The supplied SSN is not valid',
            'request_text_invalid': 'The supplied agreement text is not valid',
            'request_user_invalid': 'The specified USER could not be found',
            'already_in_progress': 'A transaction was already pending',
            'request_id_invalid': 'The supplied request id cannot be found',
            'validation_failed': 'The signature integrity validation failed'
        }
        var responseDescription = code in responseCodes ? responseCodes[code] : 'Unknown error state'

        return {
            status: "error",
            code: code,
            description: responseDescription,
            details: details || ''
        };
    
    }

    //Request Pending Messages
    _createPendingMessage(code) {

        var responseCodes = {
            'notdelivered': 'The transaction has not initialized yet',
            'delivered': 'Delivered to mobile phone',
            'user_in_app': 'The user have started the app',
        }
        var responseDescription = code in responseCodes ? responseCodes[code] : 'Unknown pending state'

        return {
            status: "pending",
            code: `pending_${code}`,
            description: responseDescription
        };
    }

    //Request initialization messages
    _createInitializationMessage(id,extras=undefined) {
        return {
            status: "initialized",
            id: id,
            extra: extras || {}
        };
    }

    //Request initialization messages
    _createSuccessMessage(extras=undefined) {
        return {
            status: "success",
            extra: extras || {}
        };
    }    

    async authRequest(id, initCallback=undefined, statusCallback=undefined) {
        var initResponse = await this.initAuthRequest(id);
        return await this._followRequest(initResponse,initCallback,statusCallback);
    }

    async signRequest(id, text, initCallback=undefined, statusCallback=undefined) {
        var initResponse = await this.initSignRequest(id,text);
        return await this._followRequest(initResponse,initCallback,statusCallback);
    }

    async _followRequest(initRequest,initCallback,statusCallback) {

        if (initRequest.status==='error') { return initRequest; }
        if (initCallback) { initCallback(initRequest); }

        while(true) {
            var pollResponse = initRequest.extra.method==='auth' ? await this.pollAuthRequest(initRequest.id) : await this.pollSignRequest(initRequest.id);
            if (pollResponse.status==="completed"||pollResponse.status==="error") return pollResponse;
            if (statusCallback) statusCallback(pollResponse);

            await new Promise(resolve => setTimeout(resolve,2000));
        }
    }

    //Simple httpRequest function supporting get and post
    async _httpRequest(url,options={},data=undefined) {
        return new Promise((resolve) => {

            //Create request options, automatically determine if get or post
            var pjson = require('../package.json');
            var options = Object.assign({
                agent: this.httpsAgent,
                method: data ? "POST": "GET",
                headers: {
                    'User-Agent': `eid/${pjson.version} (${this.clientInfo.name}/${this.clientInfo.version})`,
                    'Content-Type': 'application/json'
                }
            }, options);

            //if we are doing a post also let them know the size of our data
            if (data) options.headers['Content-Length']= data.length;

            //Make the request
            var req = https.request(url, options, (res) => {
                let data = '';

                // called on each piece of data
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // called when the complete response is received.
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: data
                    });
                });

            }).on("error", (err) => {
                resolve({
                    statusCode: 599,
                    statusMessage: err.message,
                    headers: {},
                    data: ''
                });
            });

            //If we are doing POST we also need to send the data of
            if (data) {
                req.write(data);
                req.end();    
            }
        });        
    }

}

module.exports = BaseClient;