const BaseClient = require('../baseclient.js');

class Signicat extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)
        this.accessToken = undefined;

        this.clientInfo = {        
            name: "Signicat",                            //the name of this client
            version: "20210409",                         //revision/version for this client
            author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
            url: "https://github.com/DSorlov/eid",       //where does this client live
            methods: ['auth']                            //should contain 'auth' and/or 'sign' depending on the module
        };
    };

    async _getAccessToken() {
        const authString = Buffer.from(`${this.settings.client_id}:${this.settings.client_secret}`).toString('base64');

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'identify');
        
        const options = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic '+authString
            }
        }

        var result = await this._httpRequest(this.settings.oauth_endpoint,options,params.toString());
        
        if (result.statusCode===200) {
            this.accessToken = result.json;
            return this._createSuccessMessage();
        } 

        if (result.statusCode===599) return this._createErrorMessage('internal_error',result.statusMessage);
        
        try {
            return this._createErrorMessage('api_error', result.json.error);
        } catch (err) {
            return this._createErrorMessage('communication_error', "Cannot parse error message from remote server, http_state is "+result.statusCode);
        }
    }

    //Required method for polling/checking a existing request
    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var apiResponse = await this._authenticatedRequest(this.settings.api_endpoint+'/identification/v2/sessions/'+data.id);

        if (apiResponse.statusCode===200) {

            if (apiResponse.json.error) {

                switch(apiResponse.json.error.code) {
                    case "alreadyInProgress":
                        return this._createErrorMessage('already_in_progress');
                    default:
                        return this._createErrorMessage('api_error',apiResponse.json.error.message);
                }

            } else {

                switch(apiResponse.json.status) {
                    case "created":
                        return this._createPendingMessage('delivered');
                    case "success":
                        return this._createCompletionMessage(
                            apiResponse.json.identity.nin,
                            apiResponse.json.identity.firstName,
                            apiResponse.json.identity.lastName,
                            apiResponse.json.identity.fullName,
                            apiResponse.json.auditTrail);
                    case "failed":
                        return this._createErrorMessage('api_error','Catch 22');
                    default:
                        return this._createErrorMessage('api_error', apiResponse.json.status)
                }

            }
            
        } else {
            try {
                switch(apiResponse.json.code){
                    case 'ID-1000':
                        return this._createErrorMessage('request_id_invalid');
                    default:
                        return this._createErrorMessage('api_error', apiResponse.json.message)
                }
            }catch (err) {
                return this._createErrorMessage('communication_error', 'Could not parse error: '+ apiResponse.statusMessage)
            }
        }


    }

    //Required method for cancelling a existing request
    async cancelRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    async _authenticatedRequest(url,options={},data=undefined) {
        const headers = Object.assign({
            'Authorization': 'Bearer '+ this.accessToken.access_token
        },options&&options.headers ? options.headers : {});
        options.headers = headers;

        return await this._httpRequest(url,options,data)
    }

    //Required method for initializing a request
    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        if (!this.accessToken) {
            var result = await this._getAccessToken();
            if (result.status==="error") return result;
        }

        var requestObject = {
            allowedProviders: ['se_bankid'],
            flow: 'headless',
            include: [
                'name',
                'nin'
            ],
            prefilledInput: {
                nin: data.id
            }
        };

        var apiResponse = await this._authenticatedRequest(this.settings.api_endpoint+'/identification/v2/sessions',{},JSON.stringify(requestObject));
        
        if (apiResponse.statusCode===201) {
            var statusRequest = await this.pollRequest({id: apiResponse.json.id});

            if (statusRequest.status==="error") 
                return statusRequest;
            else 
                return this._createInitializationMessage(apiResponse.json.id);

        } else {
            try {
                return this._createErrorMessage('api_error', apiResponse.json.errors[0].message);
            }catch (err) {
                return this._createErrorMessage('communication_error', 'Could not parse error: '+ apiResponse.statusMessage)
            }
        }

    }

}

module.exports = Signicat;