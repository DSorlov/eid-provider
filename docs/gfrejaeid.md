## Freja eID via GrandID by Svensk e-Identitet (gfrejaeid)

### Description
This module works by interfacing the GrandID service by Svensk e-Identitet.
It is supplied only with basic information. You need to obtain your own credentials.

This module is currently not recomended for production as it is not officially supported by GrandID as they do not currently have a silent integration method for Freja eID. Hopefully this can be updated in the future. Does not support other countries than Sweden due to the scraping magic.

This module does not currently implement signing!

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