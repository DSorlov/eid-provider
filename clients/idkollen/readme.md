## ID Kollen (BankID)

Client for communication with ID Kollen.

To use IDKollen API (both test and production) you will need to contact IDKollen to obtain a key. See (https://idkollen.se/)[https://idkollen.se/]

Due to the API beeing a call-back API a postback endpoint is created for each request using https://webhook.site/ and a temporary endpoint, the endpoint is deleted once there response is received. You do not need Webhook Premium, but if you are using it you can make sure your urls and data are deleted as appropiate and that no limts are imposed. You will need a key from webhook only if you use their premium service.

| Information |   |
| --- | --- |
| Version | 20210408 |
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
    clientType: 'idkollen',
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
    // The key obtained from ID kollen
    key: '...',
    // The key obtained from http://webhook.site
    webhookkey: '...',
};
```

### Extension Methods

None.