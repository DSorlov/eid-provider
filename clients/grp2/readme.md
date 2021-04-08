## GRP2/Funktionstjänster (BankID and Freja eID)

Client for communication with GRP2/Funktionstjänster (CGI) interface for BankID and Freja eID.
The cancelRequest is just stubbed due to not beeing implemented by the supplier.



| Information |   |
| --- | --- |
| Version | 20210408 |
| Status | Built-in |
| Author | Daniel Sörlöv <daniel@sorlov.com> |
| Client URL | https://github.com/DSorlov/eid/clients/grp2 |

### Feature Table

| Feature | Supported |
| --- | --- |
| Authentication | :heavy_check_mark: |
| Signatures | :heavy_check_mark: |

### Configuration Factory

Supports configuration factory, using attributes:

* `enviroment` to specify either `production` or `testing`.
* `provider` to specify either `freja` or `bankid`.

```javascript
var config = eid.configFactory({
    clientType: 'grp2',
    enviroment: 'testing'
    provider: 'freja'
});
```

### Configuration Object

Use the Configuration Factory to get a pre-populated object

```javascript
var config = {
    // The base URI to call the GRP2 API
    endpoint: 'https://grp.funktionstjanster.se:18898/grp/v2?wsdl',
    // The CA public cert for SSL communications
    ca_cert: fs.readFileSync(__dirname +'frejaeid_prod.ca'),
    // Display name as provided by CGI
    display_name: '',
    // Policy name as provided by CGI
    policy: ''
};
```

### Extension Methods

The `doRequest` and `initRequest` accepts additional parameter `endUserIP` which can be set to the end user ip / remote requester ip. If not supplied it will be replaced by '127.0.0.1' as in earlier versions. This however only applies when using `bankid` as provider.