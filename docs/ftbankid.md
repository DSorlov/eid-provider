## BankID via Funktionstjänster by CGI (ftbankid)

### Description
This module works by interfacing the Funktionstjänster GRP2 service by CGI.
It is supplied with working testing credentials and basic production details.

### Inputs and outputs

**Alternative inputs**

Also accepts objects with `ssn` (Social Security Number) property.

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
>**Default production configuration (settings.production)**
```
endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2?wsdl',
ca_cert: fs.readFileSync(`./certs/ftbankid_prod.ca`),
display_name: '',
policy: ''
```
>**Default testing configuration (settings.testing)**
```
endpoint: 'https://grpt.funktionstjanster.se:18898/grp/v2?wsdl',
ca_cert: fs.readFileSync(`./certs/ftbankid_test.ca`),
display_name: 'test',
policy: 'logtest020'
```