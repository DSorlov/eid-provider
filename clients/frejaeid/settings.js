const path = require('path');
const fs = require('fs');

module.exports = function(options) {

    if (options&&options.enviroment&&options.enviroment==='production') {
        return Object.assign({
            clientType: 'frejaeid',
            endpoint: 'https://services.prod.frejaeid.com',
            client_cert: '',
            password: '',
            ca_cert: fs.readFileSync(path.join(__dirname,'/cert','prod.ca')),
            jwt_cert: {
                'wSYLdhe93ToPR2X1UrNXxOg1juI': fs.readFileSync(path.join(__dirname,'/cert','prod_wSYLdhe93ToPR2X1UrNXxOg1juI.jwt'))
            },
            minimumLevel: 'EXTENDED',
            userConfirmationMethod: 'DEFAULT',
            default_country: 'SE',
            id_type: 'SSN',
            attribute_list: ['EMAIL_ADDRESS','RELYING_PARTY_USER_ID','BASIC_USER_INFO','SSN','ADDRESSES','DATE_OF_BIRTH','ALL_EMAIL_ADDRESSES'],
            relyingPartyId: ''
        }, (options||options.set) ? options.set : {});
    }

    return Object.assign({
        clientType: 'frejaeid',
        endpoint: 'https://services.test.frejaeid.com',
        client_cert: fs.readFileSync(path.join(__dirname,'/cert','test.pfx')),
        ca_cert: fs.readFileSync(path.join(__dirname,'/cert','test.ca')),
        jwt_cert: {
            'DiZbzBfysUm6-IwI-GtienEsbjc': fs.readFileSync(path.join(__dirname,'/cert','test_DiZbzBfysUm6-IwI-GtienEsbjc.jwt'))
        },
        minimumLevel: 'EXTENDED',
        userConfirmationMethod: 'DEFAULT',
        password: 'test',
        default_country: 'SE',
        id_type: 'SSN',
        attribute_list: ['EMAIL_ADDRESS','RELYING_PARTY_USER_ID','BASIC_USER_INFO','SSN','ADDRESSES','DATE_OF_BIRTH','ALL_EMAIL_ADDRESSES'],
        relyingPartyId: ''    
    }, (options||options.set) ? options.set : {});            

}