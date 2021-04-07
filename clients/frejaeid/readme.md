## Freja eID (FrejaEID)

Client for direct API communication with Freja eID REST API (Freja eID AB).



| Information |   |
| --- | --- |
| Version | 20210406 |
| Status | Built-in |
| Author | Daniel Sörlöv <daniel@sorlov.com> |
| Client URL | https://github.com/DSorlov/eid/clients/frejaeid |

### Feature Table

| Feature | Supported |
| --- | --- |
| Authentication | :heavy_check_mark: |
| Signatures | :heavy_check_mark: |

### Configuration Factory

Supports configuration factory using attribute `enviroment` to specify either `production` or `testing`.

```javascript
var config = eid.configFactory({
    clientType: 'frejaeid',
    enviroment: 'testing'
});
```

### Configuration Object

Use the Configuration Factory to get a pre-populated object.
See [Freja eID developer docs](https://frejaeid.com/rest-api/Freja%20eID%20Relying%20Party%20Developers'%20Documentation)

```javascript
var config = {
    // Client type (must be frejaeid to use this client)
    clientType: 'frejaeid',
    // The base URI to call the Rest-API
    endpoint: 'https://services.test.frejaeid.com',
    // The PFX file content to use
    client_cert: '...',
    // The password for the PFX
    password: 'test',
    // The CA public cert for SSL communications
    ca_cert: '...',
    // An class containing the signing certs used by the service
    jwt_cert: {
        '2LQIrINOzwWAVDhoYybqUcXXmVs': '...',
        'HwMHK_gb3_iuNF1advMtlG0-fUs': '...'
    },
    // The minimum level to accept
    minimumLevel: 'EXTENDED',
    // Default country when calling identification with just an SSN
    default_country: 'SE',
    // The UserInfo field
    id_type: 'SSN',
    // Attributes to retrieve 
    attribute_list: ['EMAIL_ADDRESS','RELYING_PARTY_USER_ID','BASIC_USER_INFO','SSN','ADDRESSES','DATE_OF_BIRTH','ALL_EMAIL_ADDRESSES']    
};
```

### Extensions

Freja eID allows Relying parties (RP) to manage a single, RP-specific attribute, through the Custom identifier management service. 

A typical use of this option would be to allow for login identifiers specific to your organisation to be returned within the result of authentication. In other words, the end user can use their preferred identifier at login, e.g. email address. Freja eID performs the translation to the custom identifier, previously configured by the RP, e.g. employee number or domain login. In such a way, it is straightforward for RPs to map user identifiers to those known within their internal systems, without the need to store this mapping in an internal database or LDAP.

A custom identifier must be unique within the requesting relying party system inside the Freja eID service. In other words, Freja eID does not allow two identical custom attributes to be set by the same RP. In order to set a custom identifier for a user, the RP needs to obtain the existing user information for that user in the Freja eID system (e.g. the email address the user has connected to Freja eID or the social security number, if the user is on the Freja eID+ level) and pass it in the call to Freja eID services. 

**Extension methods**
* `createCustomIdentifier(id,ident)` Creates a new custom identifier (ident) on an existing identity (id).
* `deleteCustomIdentifier(ident)` Removes a custom identifier (ident) regardless of the user currently assigned