## BankID (bankid)

### Description
This module lets you communicate and use the IDKollen V2 API.

To use IDKollen API (both test and production) you will need to contact
IDKollen to obtain a key. See (https://idkollen.se/)[https://idkollen.se/]

Due to the API beeing a call-back API a postback endpoint is created
for each request using https://webhook.site/ and a temporary endpoint,
the endpoint deletes once there response is received. You do not need
Webhook Premium, but if you are using it you can make sure your urls
and data are deleted as appropiate and that no limts are imposed.

### Inputs and outputs

**Alternative inputs**

Also accepts objects with `ssn` (Social Security Number) property.

**Extra fields on completion**
* `autostart_token` the token used for autostart
* `autostart_url` code for invoking authorization

### Default Configuration
>**Default production configuration (settings.production)**
```
endpoint:  'https://api.idkollen.se/v2',
key:  '',
webhookkey: ''
```
>**Default testing configuration (settings.testing)**
```
endpoint:  'https://stgapi.idkollen.se/v2',
key:  '',
webhookkey: ''
```