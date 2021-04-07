## Swedish BankID (BankID)

Client for direct API communication with BankID (Finansiell ID-Teknik AB).

### Client Information

| Version | 20210406 |
| Author | Daniel Sörlöv <daniel@sorlov.com> |
| Status | Built-in |
| Info URL | https://github.com/DSorlov/eid/clients/bankid |

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
    // Client type (must be frejaeid to use this client)
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

The `doRequest` and `initRequest` accepts additional parameter `endUserIP` which can be set to the end user ip / remote requester ip. If not supplied it will be replaced by '127.0.0.1' as in earlier versions.