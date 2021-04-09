const path = require('path');
const fs = require('fs');
//This module only provides a template class for configuration that
//the user will later use to load a client. Options object passed
//in is discretionary and might be used for alternative enviroments etc.
module.exports = function(options) {

    // Check if production
    if (options&&options.enviroment&&options.enviroment==='production') {
        
        if (options.provider&&options.provider==='freja') {
            return Object.assign({
                clientType: 'grp2',
                endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2',
                ca_cert: fs.readFileSync(path.join(__dirname,'/cert','/frejaeid_prod.ca')),
                display_name: '',
                policy: '',
                provider: 'freja'
            }, (options||options.set) ? options.set : {});  
        } else if (options.provider&&options.provider==='bankid') {
            //Return a object with all the required config for production
            return Object.assign({
                clientType: 'grp2',
                endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2',
                ca_cert: fs.readFileSync(path.join(__dirname,'/cert','/bankid_prod.ca')),
                display_name: '',
                policy: '',
                provider: 'bankid'            
            }, (options||options.set) ? options.set : {});
        } else {
            return Object.assign({
                clientType: 'grp2',
                endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2',
                ca_cert: '',
                display_name: '',
                policy: '',
                provider: ''            
            }, (options||options.set) ? options.set : {});
        }
    }

    //Return a object with all the required config for testing
    if (options.provider&&options.provider==='freja') {
        return Object.assign({
            clientType: 'grp2',
            endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2',
            ca_cert: fs.readFileSync(path.join(__dirname,'/cert','/frejaeid_test.ca')),
            display_name: 'test',
            policy: 'logtest020',
            provider: 'freja'
        }, (options||options.set) ? options.set : {});  
    } else if (options.provider&&options.provider==='bankid') {
        //Return a object with all the required config for production
        return Object.assign({
            clientType: 'grp2',
            endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2',
            ca_cert: fs.readFileSync(path.join(__dirname,'/cert','bankid_test.ca')),
            display_name: 'test',
            policy: 'logtest020',
            provider: 'bankid'
        }, (options||options.set) ? options.set : {});
    } else {
        return Object.assign({
            clientType: 'grp2',
            endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2',
            ca_cert: '',
            display_name: '',
            provider: '',
            policy: ''            
        }, (options||options.set) ? options.set : {});
    }

}