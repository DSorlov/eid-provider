const BaseClient = require('../baseclient.js');
const crypto = require("crypto");
const path = require('path');
const fs = require('fs');

class GRP2 extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)

        this.clientInfo = {        
            name: "GRP2",                      //the name of this client
            version: "20210408",                         //revision/version for this client
            author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
            url: "https://github.com/DSorlov/eid-provider",       //where does this client live
            methods: ['auth','sign']                                  //should contain 'auth' and/or 'sign' depending on the module
        };

        //Make sure we do not poll more often than CGI allows. 
        this.retryDelay = 3000;

        // If the client needs customization of the http-agent this can be done by sending in
        // arguments for the https agent.
        this._customAgent({
            ca: this.settings.ca_cert
        });

    };

    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var requestTemplate = fs.readFileSync(path.join(__dirname,"/xml","collectRequest.xml"),'utf8')
            .replace("${uuid}",crypto.randomBytes(16).toString("hex"))
            .replace("${policy}",this.settings.policy)
            .replace("${provider}",this.settings.provider)
            .replace("${displayName}",this.settings.display_name)
            .replace("${orderRef}", data.id);

        var result = await this._httpRequest(this.settings.endpoint,{headers:{'Content-Type': 'application/soap+xml'}},requestTemplate);

        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            var pattern = '<progressStatus>(?<progressStatus>.*)<\/progressStatus>';
            var responseData = this._parseResponse(result.data,pattern);

            switch(responseData.progressStatus) {
                case "OUTSTANDING_TRANSACTION":
                    return this._createPendingMessage('notdelivered');
                case "USER_SIGN":
                    return this._createPendingMessage('user_in_app');
                case "NO_CLIENT":
                    return this._createPendingMessage('delivered');
                case "COMPLETE":
                    var dataPattern = "<userInfo><subjectIdentifier>(?<ssn>.*)</subjectIdentifier>.*<givenName>(?<firstname>.*)<\/givenName><sn>(?<lastname>.*)<\/sn><\/userInfo><validationInfo><signature>(?<signature>.*)<\/signature>";
                    var userResponse = this._parseResponse(result.data,dataPattern);

                    return this._createCompletionMessage(
                        userResponse.ssn,
                        userResponse.firstname,
                        userResponse.lastname,
                        userResponse.firstname + " " + userResponse.lastname,
                        {
                            signature: userResponse.signature
                        }
                    );

                default:
                    return this._createErrorMessage('api_error','Unkown response code: '+responseData.progressStatus);
            }
        } else {
            return this._parseErrorResponse(result.data);
        }

    }

    // by some strange reason GRP2 have not implemented a cancel function
    // so this is just a placeholder untill that implementation is done
    async cancelRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        return this._createSuccessMessage();
    }    

    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');
        var requestTemplate = '';

        if (data.text) {
            requestTemplate = fs.readFileSync(path.join(__dirname,"/xml","signRequest.xml"),'utf8')
                .replace("${uuid}",crypto.randomBytes(16).toString("hex"))
                .replace("${policy}",this.settings.policy)
                .replace("${provider}",this.settings.provider)
                .replace("${displayName}",this.settings.display_name)
                .replace("${subjectIdentifier}", data.id)
                .replace("${value}", data.endUserIp ? data.endUserUp : '127.0.0.1')
                .replace("${userVisibleData}",Buffer.from(data.text).toString('base64'));
        } else {
             requestTemplate = fs.readFileSync(path.join(__dirname,"/xml","authenticateRequest.xml"),'utf8')
                .replace("${uuid}",crypto.randomBytes(16).toString("hex"))
                .replace("${policy}",this.settings.policy)
                .replace("${provider}",this.settings.provider)
                .replace("${displayName}",this.settings.display_name)
                .replace("${subjectIdentifier}", data.id)
                .replace("${value}", data.endUserIp ? data.endUserUp : '127.0.0.1');
        }

        var result = await this._httpRequest(this.settings.endpoint,{headers:{'Content-Type': 'application/soap+xml'}},requestTemplate);

        if (result.statusCode===599) {
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (result.statusCode===200) {
            var pattern = '<orderRef>(?<orderRef>.*)<\/orderRef>';
            var responseData = this._parseResponse(result.data,pattern);

            if (this.settings.provider==="freja") {
                return this._createInitializationMessage(responseData.orderRef, {
                    autostart_token: responseData.orderRef.substring(1),
                    autostart_url: "frejaeid://bindUserToTransaction?transactionReference="+encodeURIComponent(responseData.autoStartToken)
                });    
            } else if (this.settings.provider==="bankid") {
                return this._createInitializationMessage(responseData.orderRef, {
                    autostart_token: responseData.orderRef.substring(1),
                    autostart_url: "bankid:///?autostarttoken="+responseData.autoStartToken+"&redirect=null"
                });    
            } else {
                return this._createInitializationMessage(responseData.orderRef, {});
            }

        } else {
            return this._parseErrorResponse(result.data);
        }
    }

    _parseResponse(text,expression) {
        var regexp = new RegExp(expression)
        var matches = regexp.exec(text);
        return matches.groups || {}
    }

    _parseErrorResponse(data) {
        var regexp = /<S:Reason><S:Text xml:lang="en">(.*)<\/S:Text><\/S:Reason>.*<faultStatus>(.*)<\/faultStatus>.*<detailedDescription>(.*)<\/detailedDescription>/g;
        var matches = regexp.exec(data);

        if (!matches||matches.length!=4) {
            return this._createErrorMessage('communication_error','Could not parse error message');
        }

        switch(matches[2]) {
            case 'USER_CANCEL':
                return {status: 'error', code: 'cancelled_by_user', description: 'The user declined transaction'};
            case 'EXPIRED_TRANSACTION':
                return {status: 'error', code: 'expired_transaction', description: 'The transaction was not completed in time'};
            case 'ALREADY_IN_PROGRESS':
                return this._createErrorMessage('already_in_progress');
            case 'INVALID_PARAMETERS':
                if (matches[3]==='Incorrect personalNumber') {
                    return this._createErrorMessage('request_ssn_invalid');
                } else if (matches[3]==='Invalid userVisibleData') {
                    return this._createErrorMessage('request_text_invalid');
                } else if (matches[3]==='No such order') {
                    return this._createErrorMessage('request_id_invalid');
                } else {
                    return this._createErrorMessage('api_error',matches[4]);
                }
            default:
                return this._createErrorMessage('api_error',matches[4]);
        }        
    }

}

module.exports = GRP2;