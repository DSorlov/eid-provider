
//Universal loader of eid modules
function initModule(provider) {
    var module = {};
    var library = require("./"+provider+".js")

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

    return module;
};

// These are the most important, they are for calling the respective native apis.
module.exports.bankid = initModule('bankid');
module.exports.frejaeid = initModule('frejaeid');

// Theese are for Funktionstjänster by CGI
module.exports.ftbankid = initModule('ftbankid');
module.exports.ftfrejaeid = initModule('ftfrejaeid');

// Theese are for GrandID by Svensk e-Legitimation
module.exports.gbankid = initModule('gbankid');
module.exports.gfrejaeid = initModule('gfrejaeid');
