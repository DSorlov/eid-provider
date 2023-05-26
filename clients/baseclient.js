const crypto = require("crypto");
const https = require('https');

class BaseClient {

    constructor(settings) {
        //Would this ever be needed?
        //this.settings = settings || {};
        this.clientType = "BaseClient";
        this.clientID = crypto.randomBytes(16).toString("hex");
        this.httpsAgent = false;
        this.retryDelay = 2000;
    }

    // A number of compability methods to support old style
    async pollAuthStatus(id) {
        return await this.pollRequest({id: id});
    }
    async pollSignStatus(id) {
        return await this.pollRequest({id: id});
    }
    async cancelAuthRequest(id) {
        return await this.cancelRequest({id: id});
    }
    async cancelSignRequest(id) {
        return await this.cancelSignRequest({id: id});
    }
    async initAuthRequest(id) {
        return await this.initRequest({id: id});
    }
    async initSignRequest(id,text) {
        return await this.initRequest({id: id, text: text});
    }
    async authRequest(id, initCallback=undefined, statusCallback=undefined) {
        var doArgs = {
            id: id
        }
        if (initCallback) doArgs.initCallback = initCallback;
        if (statusCallback) doArgs.statusCallback = statusCallback;
        return await this.doRequest(doArgs);
    }
    async signRequest(id, text, initCallback=undefined, statusCallback=undefined) {
        var doArgs = {
            id: id,
            text: text
        }
        if (initCallback) doArgs.initCallback = initCallback;
        if (statusCallback) doArgs.statusCallback = statusCallback;
        return await this.doRequest(doArgs);
    }

    // Tracks a request
    async doRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');

        var initResponse = await this.initRequest(data);
        if (initResponse.status==='error') { return initResponse; }
        if (data.initCallback) { data.initCallback(initResponse); }

        while(true) {
            var pollResponse = await this.pollRequest({id: initResponse.id});
            if (pollResponse.status==="completed"||pollResponse.status==="error") return pollResponse;
            if (data.statusCallback) data.statusCallback(pollResponse);

            await new Promise(resolve => setTimeout(resolve,this.retryDelay));
        }
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
    
    _convertToJson(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            return undefined;
        }
    }

    //Simple httpRequest function
    async _httpRequest(url,customoptions={},data=undefined) {
        return new Promise((resolve) => {

            //Lets join together all the headers
            var pjson = require('../package.json');
            var headers = Object.assign({
                'Content-Type': 'application/json',
                'User-Agent': `eid/${pjson.version} (${this.clientInfo.name}/${this.clientInfo.version})`
            }, customoptions.headers ? customoptions.headers : {});
            customoptions.headers = headers;
            
            //Create request options, automatically determine if get or post
            var options = Object.assign({
                agent: this.httpsAgent,
                method: customoptions.method ? customoptions.method : data ? "POST": "GET"
            }, customoptions);

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
                        json: this._convertToJson(data),
                        data: data
                    });
                });

            }).on("error", (err) => {
                resolve({
                    statusCode: 599,
                    statusMessage: err.message,
                    json: undefined,
                    data: undefined
                });
            });

            //If we are doing POST we also need to send the data of
            if (data) {
                req.write(data);   
            }
            req.end(); 
        });        
    }

}

module.exports = BaseClient;