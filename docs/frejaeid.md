## Freja eID (frejaeid)

### Description
This module works directly with the Freja eID REST API.
It is supplied with working testing credentials and basic production details.

### Inputs and outputs

**Alternative inputs**

Also accepts objects with `ssn` (Social Security Number) and and optional `country` properties.
If country property is missing the default country is assumed.

* If country equal to 'SE', the value must be the 12-digit format of the Swedish "personnummer" without spaces or hyphens. Example: 195210131234.
* If country equal to 'NO', the value must be the 11-digit format of the Norwegian "personnummer" without spaces or hyphens. Example: 13105212345.
* If country equal to 'FI', the value must be the 10-characters format of the Finish ''koodi'', with the hyphen before the last four control characters. Hyphen can be replaced with the letter A. Example format: 131052-308T or 131052A308T.
* If country equal to 'DK', the value must be the 10-digit format of the Danish "personnummer" without spaces or hyphens. Example: 1310521234.

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
minimumLevel:  'EXTENDED',
password:  '',
default_country: 'SE'
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://services.test.frejaeid.com',
client_cert:  fs.readFileSync('./certs/frejaeid_test.pfx'),
ca_cert:  fs.readFileSync(`./certs/frejaeid_test.ca`),
jwt_cert:  fs.readFileSync(`./certs/frejaeid_test.jwt`),
minimumLevel:  'EXTENDED',
password:  'test',
default_country: 'SE'
```