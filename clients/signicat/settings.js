//This module only provides a template class for configuration that
//the user will later use to load a client. Options object passed
//in is discretionary and might be used for alternative enviroments etc.
module.exports = function(options) {

    // Check if production
    if (options&&options.enviroment&&options.enviroment==='production') {
        
        //Return a object with all the required config for production
        return {
            clientType: 'signicat',
            oauth_endpoint: 'https://api.signicat.io/oauth/connect/token',
            api_endpoint: 'https://api.signicat.io',
            client_id: 't32243849e2344d76b2d84c7dc4d4b8fd',
            client_secret: '3gykgEmEVngGUGmlo9DUCReYx0VG6EEoDr9RMkzyMIGFlvS8ekzfqN4O8LE9cXNI'
        };
    }

    //Return a object with all the required config for testing
    return {
        clientType: 'signicat',
        oauth_endpoint: 'https://api.signicat.io/oauth/connect/token',
        api_endpoint: 'https://api.signicat.io',
        client_id: 't32243849e2344d76b2d84c7dc4d4b8fd',
        client_secret: '3gykgEmEVngGUGmlo9DUCReYx0VG6EEoDr9RMkzyMIGFlvS8ekzfqN4O8LE9cXNI',
    };        

}