//This module only provides a template class for configuration that
//the user will later use to load a client. Options object passed
//in is discretionary and might be used for alternative enviroments etc.
module.exports = function(options) {

    if (options&&options.enviroment&&options.enviroment==="production") {
        return Object.assign({
            clientType: 'grandid',
            endpoint: 'https://client.grandid.com',
            servicekey: '',
            apikey: '',
            provider: options&&options.provider ? options.provider : ''
        }, (options||options.set) ? options.set : {});    
    } else {
        return Object.assign({
            clientType: 'grandid',
            endpoint: 'https://client-test.grandid.com',
            servicekey: '',
            apikey: '',
            provider: options&&options.provider ? options.provider : ''
        }, (options||options.set) ? options.set : {});    
    }

}