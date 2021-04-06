const path = require('path');
const fs = require('fs');

module.exports = function(options) {

    if (options&&options.enviroment&&options.enviroment==='production') {
        return {
            clientType: 'frejaeid',
            endpoint: 'https://services.prod.frejaeid.com',
            client_cert: '',
            password: '',
            ca_cert: fs.readFileSync(path.join(__dirname,'prod.ca')),
            jwt_cert: {
                'aRw9OLn2BhM7hxoc458cIXHfezw': fs.readFileSync(path.join(__dirname,'prod_aRw9OLn2BhM7hxoc458cIXHfezw.jwt')),
                'onjnxVgI3oUzWQMLciD7sQZ4mqM': fs.readFileSync(path.join(__dirname,'prod_onjnxVgI3oUzWQMLciD7sQZ4mqM.jwt'))
            },
            minimumLevel: 'EXTENDED',
            default_country: 'SE',
            id_type: 'SSN',
            attribute_list: ['EMAIL_ADDRESS','RELYING_PARTY_USER_ID','BASIC_USER_INFO','SSN','ADDRESSES','DATE_OF_BIRTH','ALL_EMAIL_ADDRESSES']
        };
    }

    return {
        clientType: 'frejaeid',
        endpoint: 'https://services.test.frejaeid.com',
        client_cert: fs.readFileSync(path.join(__dirname,'test.pfx')),
        ca_cert: fs.readFileSync(path.join(__dirname,'test.ca')),
        jwt_cert: {
            '2LQIrINOzwWAVDhoYybqUcXXmVs': fs.readFileSync(path.join(__dirname,'test_2LQIrINOzwWAVDhoYybqUcXXmVs.jwt')),
            'HwMHK_gb3_iuNF1advMtlG0-fUs': fs.readFileSync(path.join(__dirname,'test_HwMHK_gb3_iuNF1advMtlG0-fUs.jwt'))
        },
        minimumLevel: 'EXTENDED',
        password: 'test',
        default_country: 'SE',
        id_type: 'SSN',
        attribute_list: ['EMAIL_ADDRESS','RELYING_PARTY_USER_ID','BASIC_USER_INFO','SSN','ADDRESSES','DATE_OF_BIRTH','ALL_EMAIL_ADDRESSES']    
    };            

}