const path = require('path');
const fs = require('fs');

module.exports = function(options) {

    if (options&&options.enviroment&&options.enviroment==='production') {
        return {
            clientType: 'bankid',
            endpoint: 'https://appapi2.bankid.com/rp/v5',
            client_cert: '',
            ca_cert: fs.readFileSync(path.join(__dirname,'/cert','bankid_prod.ca')),
            allowFingerprint: true,
            password: ''
        };
    }

    return {
        clientType: 'bankid',
        endpoint: 'https://appapi2.test.bankid.com/rp/v5',
        client_cert: fs.readFileSync(path.join(__dirname,'/cert','bankid_test.pfx')),
        ca_cert: fs.readFileSync(path.join(__dirname,'/cert','bankid_test.ca')),
        allowFingerprint: true,
        password: 'qwerty123'
    };            

}