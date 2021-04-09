## Grand ID - Svensk E-Identitet AB (BankID, Freja eID and SiTHS)

Client for communication with GrandID interface for BankID, Freja eID and SiTHS.

**This module is not yet fully tested**



| Information |   |
| --- | --- |
| Version | 20210409 |
| Status | Built-in |
| Author | Daniel Sörlöv <daniel@sorlov.com> |
| Client URL | https://github.com/DSorlov/eid-provider |

### Feature Table

| Feature | Supported |
| --- | --- |
| Authentication | :heavy_check_mark: |
| Signatures | :heavy_check_mark: |

### Configuration Factory

Supports configuration factory, using attributes:

* `enviroment` to specify either `production` or `testing`.
* `provider` to specify either `freja`, `bankid` or `siths`.

```javascript
var config = eid.configFactory({
    clientType: 'grandid',
    enviroment: 'testing',
    provider: 'freja'
});
```

### Configuration Object

Use the Configuration Factory to get a pre-populated object

```javascript
var config = {
    //The type of config
    clientType: 'grandid'
    // The base URI to call the GrandID API
    endpoint: 'https://client-test.grandid.com',
    // which provider to use, must correspond with the service key
    provider: 'siths',
    // Service key as provided from Svensk E-Identitet
    servicekey: '',
    // API key as provided from Svensk E-Identitet
    apikey: ''
};
```

### Extension Methods

The `doRequest` and `initRequest` accepts additional parameter `allowFingerprint` will allow you to decide if client should be able to use fingerprint or not. This however only applies when using `bankid` as provider.

The `id` property to initialize in `doRequest` and `initRequest` supports either sending in a mobile number (starting with +46) or email adrress when using the `freja` provider.

The `id` property to initialize in `doRequest` and `initRequest` must be formated like SENNNNNN-NNNN (HSA-ID) when using the `siths` provider.