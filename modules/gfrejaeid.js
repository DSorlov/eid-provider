const axioslibrary = require('axios').default;
const fs = require('fs');
const https = require('https');
const to = require('await-to-js').default;
const { v4: uuid } = require('uuid');

const defaultSettings = {
    production: {
        endpoint: 'https://client.grandid.com/',
        servicekey: '',
        apikey: ''
    },
    testing: {
        endpoint: 'https://client.grandid.com/',
        servicekey: '',
        apikey: ''
    }        
}

var settings = undefined;
var axios = undefined; 

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