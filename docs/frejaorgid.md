## Freja eID OrgID (frejaorgid)

### Description
This module works directly with the Freja eID REST API for Organizational IDs.
It is not supplied with any testing credentials. Contact Verisec AB.

### Inputs and outputs

**Alternative inputs**

None.

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
>**Default production configuration (settings.production)**
```
endpoint:  'https://services.prod.frejaeid.com',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/bankid_prod.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_prod.jwt`),
password:  ''
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://services.test.frejaeid.com',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/frejaeid_test.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_test.jwt`),
password:  ''
```