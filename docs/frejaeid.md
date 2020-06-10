## Freja eID (frejaeid)

### Description
This module works directly with the Freja eID REST API.
It is supplied with working testing credentials and basic production details.

This module exposes extra functions also:
- **setCustomIdentifier(user,customid): bool** Function to add a unique identifier to a user, can be used for mapping etc.
- **deleteCustomIdentifier(customid): bool** Removes the unique identifier for a user

### Inputs and outputs

**Alternative inputs**

Can accept string or object. String will be combined with default `id_type` and `default_country`. Object will be examined and properties that are usefull will be used. If a property is missing the default value is used for that field. If suitable properties are not found the last resort will call the `.toString()` of the object and use that value in combination with default `id_type`.
```
type: string [SSN,EMAIL,PHONE]
ssn: string (only if type is SSN)
country: string (only if type is SSN)
email: string (only if type is EMAIL)
phone: string (only if type is PHONE)
```

* If country equal to 'SE', the value must be the 12-digit format of the Swedish "personnummer" without spaces or hyphens. Example: 195210131234.
* If country equal to 'NO', the value must be the 11-digit format of the Norwegian "personnummer" without spaces or hyphens. Example: 13105212345.
* If country equal to 'FI', the value must be the 10-characters format of the Finish ''koodi'', with the hyphen before the last four control characters. Hyphen can be replaced with the letter A. Example format: 131052-308T or 131052A308T.
* If country equal to 'DK', the value must be the 10-digit format of the Danish "personnummer" without spaces or hyphens. Example: 1310521234.

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
attribute_list is a comma separated list of EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO,SSN,ADDRESSES,DATE_OF_BIRTH,ALL_EMAIL_ADDRESSES
minimum_level is one of BASIC,EXTENDED,PLUS
id_type is one of SSN,EMAIL,PHONE
>**Default production configuration (settings.production)**
```
endpoint:  'https://services.prod.frejaeid.com',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/bankid_prod.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_prod.jwt`),
minimum_level:  'EXTENDED',
password:  '',
default_country: 'SE',
id_type: 'SSN',
attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'        
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://services.test.frejaeid.com',
client_cert:  fs.readFileSync('./certs/frejaeid_test.pfx'),
ca_cert:  fs.readFileSync(`./certs/frejaeid_test.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_test.jwt`),
minimum_evel:  'EXTENDED',
password:  'test',
default_country: 'SE',
id_type: 'SSN',
attribute_list: 'EMAIL_ADDRESS,RELYING_PARTY_USER_ID,BASIC_USER_INFO'        
```