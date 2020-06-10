## Freja eID OrgID (frejaorgid)

### Description
This module works directly with the Freja eID REST API for Organizational IDs.
It is not supplied with any testing credentials. Contact Verisec AB.

This module exposes extra functions also:
- **addOrgIdRequest(ssn, title, attribute, value)** Adds a org id to a user, works as authRequest except returns `status: created` on success
- **pollAddOrgIdStatus(id)** Checks if id have been added, works like pollAuthRequest except returns `status: created` on success
- **initAddOrgIdRequest(ssn, title, attribute, value)** Initializes a request to add org id to a user, works like initAuthRequest
- **cancelAddOrgIdRequest(id)** Aborts a request to add org id to a user, works like cancelAuthRequest
- **deleteOrgIdRequest(id): bool** Removes a org id from a user, returns a object with a standard `status` field

### Inputs and outputs

**Alternative inputs**

Can accept string or object. String will be combined with default id_type and default_country. Object will be examined and properties that are usefull will be used. If a property is missing the default value is used for that field. If suitable properties are not found the last resort will call the .toString() of the object and use that value in combination with default id_type.
```
type: string [ORG_ID,SSN,EMAIL,PHONE]
ssn: string (only if type is SSN)
country: string (only if type is SSN)
email: string (only if type is EMAIL)
phone: string (only if type is PHONE)
org_id: string (only if type ORG_ID)
```

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
attribute_list is a comma separated list of EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO,SSN,ADDRESSES,DATE_OF_BIRTH,ALL_EMAIL_ADDRESSES
minimum_level is one of BASIC,EXTENDED,PLUS
id_type is one of ORG_ID,SSN,EMAIL,PHONE
>**Default production configuration (settings.production)**
```
endpoint:  'https://services.prod.frejaeid.com',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/bankid_prod.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_prod.jwt`),
password:  '',
default_country: 'SE',
minimum_level: 'EXTENDED',
id_type: 'ORG_ID',
attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'        
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://services.test.frejaeid.com',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/frejaeid_test.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_test.jwt`),
password:  '',
default_country: 'SE',
minimum_level: 'EXTENDED',
id_type: 'ORG_ID',
attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'       
```