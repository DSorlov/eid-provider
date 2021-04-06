const BaseClient = require('../baseclient.js');

class TemplateClient extends BaseClient {

    static clientInfo = {        
        name: "TemplateClient",                      //the name of this client
        version: "20210406",                         //revision/version for this client
        author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
        url: "https://github.com/DSorlov/eid",       //where does this client live
        methods: []                                  //should contain 'auth' and/or 'sign' depending on the module
    };

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)

        // If the client needs customization of the http-agent this can be done by sending in
        // arguments for the https agent.
        this._customAgent({});

    };

    //Required method for polling/checking a existing auth request
    //must return not_supported if not implemented and clientInfo should not contain 'auth'
    async pollAuthRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for polling/checking a existing sign request
    //must return not_supported if not implemented and clientInfo should not contain 'sign'
    async pollSignRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for cancelling a existing auth request
    //must return not_supported if not implemented and clientInfo should not contain 'auth'
    async cancelAuthRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for cancelling a existing sign request
    //must return not_supported if not implemented and clientInfo should not contain 'sign'
    async cancelSignRequest(id) {
        return this._createErrorMessage('not_supported')
    }    

    //Required method for initializing a authentication request
    //must return not_supported if not implemented and clientInfo should not contain 'auth'
    async initAuthRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for initializing a signature request
    //must return not_supported if not implemented and clientInfo should not contain 'sign'
    async initSignRequest(id,text) {
        return this._createErrorMessage('not_supported')
    }
}

module.exports = BankID;