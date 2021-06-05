## Signicat Express - (BankID, Freja eID and SiTHS)

Client for communication with Signicat Express interface for BankID in Sweden. 



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

```javascript
var config = eid.configFactory({
    clientType: 'grandid',
    enviroment: 'testing'
});
```

### Configuration Object

Use the Configuration Factory to get a pre-populated object

```javascript
var config = {
    //The type of config
    clientType: 'signicat'
    // The oauth endpoint to get credentials
    oauth_endpoint: 'https://api.signicat.io/oauth/connect/token',
    // The base URI for the API
    api_endpoint: 'https://api.signicat.io',
    // API keys from signicat
    client_id: '',
    client_secret: ''
};
```

### Extension Methods

None.
