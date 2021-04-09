const BaseClient = require('../baseclient.js');

class IDKollen extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)

        this.clientInfo = {        
            name: "IDKollen",                      //the name of this client
            version: "20210409",                         //revision/version for this client
            author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
            url: "https://github.com/DSorlov/eid",       //where does this client live
            methods: ['auth','sign']                                  //should contain 'auth' and/or 'sign' depending on the module
        };

    };

    //Required method for polling/checking a existing request
    async pollRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var orderRef = data.id.substring(0,36);
        var webhookId = data.id.substring(37,73);
        var whOptions = {};
        if (this.settings.webhookkey!=='') whOptions.headers = { 'Api-Key': this.settings.webhookkey };

        var result = await this._httpRequest('https://webhook.site/token/'+webhookId+'/request/latest/raw', whOptions);

        // No postback so not updated yet
        if (result.statusCode===404) return this._createPendingMessage('delivered');

        // Delete the webhook as we got a result!
        await this._httpRequest('https://webhook.site/token/'+webhookId, whOptions, 'delete');

        // If a error message was received dump that to the client
        if (result.json.message) {
            switch(result.json.message) {
                case 'userCancel':
                    return this._createErrorMessage('cancelled_by_user');
                case 'expiredTransaction':
                    return this._createErrorMessage('expired_transaction');
                default:
                    return this._createErrorMessage('api_error', result.json.message);
            }
        }
        
        return this._createCompletionMessage(
            result.json.pno,
            result.json.givenName,
            result.json.surname,
            result.json.name, {
                checksum: result.json.checksum,
                certdate: result.json.certStartDate
            });
        
        result.json = result.json;

    }

    //Required method for cancelling a existing request
    async cancelRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        var orderRef = data.id.substring(0,36);
        var webhookId = data.id.substring(37,73);
        var whOptions = {};
        if (this.settings.webhookkey!=='') whOptions.headers = { 'Api-Key': this.settings.webhookkey };

        await this._httpRequest('https://webhook.site/token/'+webhookId, whOptions, 'delete');

        return this._createSuccessMessage();
    }

    //Required method for initializing a request
    async initRequest(data) {
        if (typeof data !== 'object') return this._createErrorMessage('internal_error','Supplied argument is not a class');
        if (!data.id || typeof data.id !== 'string') return this._createErrorMessage('internal_error','Id argument must be string');

        // Prepare the API data
        var apiData = {
            ipAddress: data.endUserIp ? data.endUserUp : '127.0.0.1',
            pno: data.id,
            callbackUrl: 'https://webhook.site/'
        };

        // Structs needed for our webhook
        var whPostdata = JSON.stringify({
            default_status: 200,
            default_content: "Ok",
            default_content_type: "text/html",
            timeout: 0,
            cors: false,
            expiry: true
        });
        var whOptions = {};
        if (this.settings.webhookkey!=='') whOptions.headers = { 'Api-Key': this.settings.webhookkey };

        //Create webhook
        var whResponse = await this._httpRequest('https://webhook.site/token', whOptions, whPostdata);
        if (!whResponse.statusCode===200) return this._createErrorMessage('communication_error','Could not create webhook: '+whResponse.statusMessage);
        
        //Set the callback url
        apiData.callbackUrl = apiData.callbackUrl + whResponse.json.uuid;

        var endpoint = 'auth';
        if (data.text) {
            endpoint = 'sign';
            apiData.message = data.text;
        }

        var apiResponse = await this._httpRequest(`${this.settings.endpoint}/${this.settings.key}/${endpoint}`,{},JSON.stringify(apiData));

        if (apiResponse.statusCode===599) {
            await this._httpRequest('https://webhook.site/token/'+whResponse.json.uuid, whOptions, 'delete');
            return this._createErrorMessage('internal_error',result.statusMessage);
        } else if (apiResponse.statusCode===201) {

            return this._createInitializationMessage(apiResponse.json.orderRef+"-"+whResponse.json.uuid, {
                autostart_token: apiResponse.json.autoStartToken,
                autostart_url: "bankid:///?autostarttoken="+apiResponse.json.autoStartToken+"&redirect=null"
            });

        } else {

            if (apiResponse.json) {
                switch(apiResponse.json.message) {
                    case "alreadyInProgress":
                        return this._createErrorMessage('already_in_progress');
                    default:
                        await this._httpRequest('https://webhook.site/token/'+whResponse.json.uuid, whOptions, 'delete');
                        return this._createErrorMessage('api_error',apiResponse.json.message);
                }
            } else {
                await this._httpRequest('https://webhook.site/token/'+whResponse.json.uuid, whOptions, 'delete');
                return this._createErrorMessage('communication_error', apiResponse.statusMessage);
            }
        }

    }

}

module.exports = IDKollen;