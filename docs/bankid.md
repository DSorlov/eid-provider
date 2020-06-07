## BankID (bankid)

### Description
This module works directly with the BankID api.
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
endpoint:  'https://appapi2.bankid.com/rp/v5',
client_cert:  '',
ca_cert:  fs.readFileSync(`./certs/bankid_prod.ca`),
allowFingerprint:  true,
password:  ''
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://appapi2.test.bankid.com/rp/v5',
client_cert:  fs.readFileSync('./certs/bankid_test.pfx'),
ca_cert:  fs.readFileSync(`./certs/bankid_test.ca`),
allowFingerprint:  true,
password:  'qwerty123'
```