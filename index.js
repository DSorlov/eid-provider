const path = require('path');
const fs = require('fs');

async function clientListAsync() {
    return clientList();
}

function clientList() {
    const clientPath = path.join(__dirname,"/clients/");
    const allClients = fs.readdirSync(clientPath, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name).filter(clnt => clnt !== 'template');

    var clientInfo = [];
    allClients.forEach(loadClient => {
        try {
            var dynModPath = path.join(__dirname,"/clients/",loadClient,"/client.js");
            var dynClass = require(dynModPath);
            var clientClass = new dynClass({});
            clientInfo.push(Object.assign(clientClass.clientInfo,{
                id: loadClient,
                path: dynModPath,
                authSupported: (clientClass.clientInfo.methods.includes("auth")) ? true : false,
                signSupported: (clientClass.clientInfo.methods.includes("sign")) ? true : false,
                toString: function() { return loadClient; }
            }));
        } catch(err) {
            throw new Error(`getConfigObject Error: ${clientType} instancing error: ${err}`)
        }
    });

    return clientInfo;
}

async function configFactoryAsync(settings) {
    return configFactory(settings);
}

function configFactory(settings) {

    //Make sure we get some good config data
    if (!settings) throw new Error("getConfigObject Error: Settings are missing.");
    if (!settings.clientType) throw new Error("getConfigObject Error: clientType property is missing.");

    //Get the specified client and then delete tha value as it should not be forwarded
    var clientType = settings.clientType;
    delete settings.clientType;

    // Get the path and if it exists 
    const dynModPath = path.join(__dirname,"/clients/",clientType,"/settings.js");
    if (fs.existsSync(dynModPath)) {

        // We get a simple object back so lets just return that
        try {
            return require(dynModPath)(settings);
        } catch(err) {
            throw new Error(`getConfigObject Error: ${clientType} instancing error: ${err}`)
        }

    } else {
        throw new Error(`getConfigObject Error: ${clientType} is not found.`)
    }

}

async function clientFactoryAsync(settings) {
    return clientFactory(settings);
}

function clientFactory(settings) {

    //Make sure we get some good input data
    if (!settings) throw new Error("clientFactory Error: Client settings are missing.");
    if (!settings.clientType) throw new Error("clientFactory Error: clientType property is missing.");

    //Get the specified client and then delete tha value as it should not be forwarded
    var clientType = settings.clientType;
    delete settings.clientType;

    // Get the path and if it exists 
    const dynModPath = path.join(__dirname,"/clients/",clientType,"/client.js");
    if (fs.existsSync(dynModPath)) {

        //Create a new client class and return it
        try {
            const clientClass = require(dynModPath);
            return new clientClass(settings);
        } catch(err) {
            throw new Error(`clientFactory Error: ${clientType} instancing error: ${err}`)
        }

    } else {
        throw new Error(`clientFactory Error: ${clientType} is not found.`)
    }

}

module.exports = {
    configFactory,
    configFactoryAsync,
    clientFactory,
    clientFactoryAsync,
    clientList,
    clientListAsync    
}