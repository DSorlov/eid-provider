const BaseClient = require('../baseclient.js');

class TemplateClient extends BaseClient {

    constructor(settings) {
        super(settings);
        this.settings = settings || {};                  //settings are used to store... ehh.. settings =)

        this.clientInfo = {        
            name: "TemplateClient",                      //the name of this client
            version: "20210408",                         //revision/version for this client
            author: "Daniel Sörlöv <daniel@sorlov.com>", //who is the client author
            url: "https://github.com/DSorlov/eid",       //where does this client live
            methods: []                                  //should contain 'auth' and/or 'sign' depending on the module
        };

        // If the client needs customization of the http-agent this can be done by sending in
        // arguments for the https agent.
        this._customAgent({});

    };

    //Required method for polling/checking a existing request
    async pollRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for cancelling a existing request
    async cancelRequest(id) {
        return this._createErrorMessage('not_supported')
    }

    //Required method for initializing a request
    async initRequest(id) {
        return this._createErrorMessage('not_supported')
    }

}

module.exports = TemplateClient;