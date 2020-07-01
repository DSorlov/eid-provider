const fs = require('fs')

//Universal loader of eid modules
module.exports = function(provider) {

    // Check so module exists
    if (fs.existsSync(__dirname +"/modules/"+provider+".js")) {

        // Prepare....
        var module = {};
        var library = require(__dirname +"/modules/"+provider+".js");

        // Dunk those functions in there..
        module.settings = library.settings;
        module.initialize = library.initialize;
        module.pollSignStatus = library.pollSignStatus;
        module.pollAuthStatus = library.pollAuthStatus;
        module.signRequest = library.signRequest;
        module.authRequest = library.authRequest;
        module.initAuthRequest = library.initAuthRequest;
        module.initSignRequest = library.initSignRequest;
        module.cancelSignRequest = library.cancelSignRequest;
        module.cancelAuthRequest = library.cancelAuthRequest;

        // Support for exposing additional methods.
        // Since these are asymetrical they do NOT need to conform
        // to any form of input or output standard
        if (library.extras) for(var extraFunction in library.extras) {
            module[extraFunction] = library.extras[extraFunction];
        }

        // Give it to our master
        return module;

    } else {

        // Sigh. That module does not exist. Yet. Contribute?
        throw new Error('There is no such eid-provider module');

    }

}