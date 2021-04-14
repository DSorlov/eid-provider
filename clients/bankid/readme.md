## Swedish BankID (BankID)

Client for direct API communication with BankID (Finansiell ID-Teknik AB).



| Information |   |
| --- | --- |
| Version | 20210406 |
| Status | Built-in |
| Author | Daniel Sörlöv <daniel@sorlov.com> |
| Client URL | https://github.com/DSorlov/eid-provider |

### Feature Table

| Feature | Supported |
| --- | --- |
| Authentication | :heavy_check_mark: |
| Signatures | :heavy_check_mark: |

### Configuration Factory

Supports configuration factory using attribute `enviroment` to specify either `production` or `testing`.

```javascript
var config = eid.configFactory({
    clientType: 'bankid',
    enviroment: 'testing'
});
```

### Configuration Object

Use the Configuration Factory to get a pre-populated object

```javascript
var config = {
    // Client type (must be bankid to use this client)
    clientType: 'bankid',
    // The base URI to call the Rest-API
    endpoint: 'https://appapi2.test.bankid.com/rp/v5',
    // The PFX file content to use
    client_cert: '...',
    // The password for the PFX
    password: 'test',
    // The CA public cert for SSL communications
    ca_cert: '...',
    // Allow usage of fingerprint to sign in app for end-users
    allowFingerprint: true
};
```

### Extension Methods

The `doRequest` and `initRequest` accepts additional parameter `endUserIP` which can be set to the end user ip / remote requester ip. If not supplied it will be replaced by '127.0.0.1' as in earlier versions. Also accept `allowFingerprint` as boolean to specify if fingerprint auth is allowed in the app or not, if not specified default value from config will be used.

If `id` is not supplied to `doRequest` and `initRequest` the request will start and the properties `qrStartSecret`,`qrStartToken`,`qrAuthTime` will be returned as extra attributes for use with QR-code logins. Also the `qrCodeString` is populated with an initial calculation for the request. 

**Extension methods**

* `createQRCodeString({qrStartSecret,qrStartToken,qrAuthTime})`<br/>Returns a correctly formatted QR-code for starting BankID app. The paramets are obtained when starting a authentication request without a id. It then returns `qrStartSecret`,`qrStartToken`,`qrAuthTime` as extra attributes. This method must be polled every 5 seconds at the most to obtain a new code when using QR-login.
