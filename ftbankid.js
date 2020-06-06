const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const { v4: uuid } = require('uuid');

const defaultSettings = {
    production: {
        endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2?wsdl',
        ca_cert: fs.readFileSync(`./certs/ftbankid_prod.ca`),
        display_name: '',
        policy: ''
    },
    testing: {
        endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2?wsdl',
        ca_cert: fs.readFileSync(`./certs/ftbankid_test.ca`),
        display_name: 'test',
        policy: 'logtest020'
    }        
}

var settings = undefined;
var axios = undefined; 

function initialize(settings) {
    //TODO: Validate the incomming object for completeness.
    this.settings = settings;
    this.axios = axioslibrary.create({
        httpsAgent: new https.Agent({
          ca: settings.ca_cert,
        }),     
        headers: {
          'Content-Type': 'application/json',
        },
    });    
}

function notImplemented() {
    throw('Method not implemented');
}

module.exports = {
    settings: defaultSettings,
    initialize: initialize,
    pollAuthStatus: notImplemented,
    pollSignStatus: notImplemented,
    signRequest: notImplemented,
    authRequest: notImplemented,
    initAuthRequest: notImplemented,
    initSignRequest: notImplemented,
    cancelSignRequest: notImplemented,
    cancelAuthRequest: notImplemented
}