## BankID via GrandID by Svensk e-Identitet (gbankid)

### Description
This module works by interfacing the GrandID service.
It is supplied only with basic information. You need to obtain your own credentials.

### Inputs and outputs

**Alternative inputs**

Also accepts objects with `ssn` (Social Security Number) property.

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
>**Default production configuration (settings.production)**
```
endpoint: 'https://client.grandid.com/',
servicekey: '',
apikey: ''
```
>**Default testing configuration (settings.testing)**
```
endpoint: 'https://client.grandid.com/',
servicekey: '',
apikey: ''
```