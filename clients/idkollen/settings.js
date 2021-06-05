//This module only provides a template class for configuration that
//the user will later use to load a client. Options object passed
//in is discretionary and might be used for alternative enviroments etc.
module.exports = function(options) {

    // Check if production
    if (options&&options.enviroment&&options.enviroment==='production') {
        
        //Return a object with all the required config for production
        return {
            clientType: 'idkollen',
            endpoint: 'https://api.idkollen.se/v2',
            key: '',
            webhookkey: ''            
        };
    }

    //Return a object with all the required config for testing
    return {
        clientType: 'idkollen',
        endpoint: 'https://stgapi.idkollen.se/v2',
        key: '',
        webhookkey: ''
    };            

}