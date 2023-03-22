## Freja eID (FrejaEID)

Client for direct API communication with Freja eID REST API (Freja eID AB).



| Information |   |
| --- | --- |
| Version | 20230322 |
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

### Extensions for identifier types

When initiating either `doRequest` and `initRequest` an `id` parameter is normally sent in. The Freja EID module allows this parameter to be a object that describes the type of credential used for the request.

* If `id` is a string, and the default `id_type` in configuration is SSN then the string is interpreted as a SSN from the `default_country` speficied in configuration.

* If `id` is a object it is checked for a property string `type` beeing one of `EMAIL`, `SSN`, `PHONE` or `INFERRED`, `country` beeing one of `SE`, `FI`, `DK`, `NO`. The id itself is retreived from `email`, `ssn` or `phone` property pending on the specified type. Defaults are used for missing properties, id value is by default calculated by `toString` on the object but overriden as stated.

### Extensions for Custom Identifiers

Freja eID allows Relying parties (RP) to manage a single, RP-specific attribute, through the Custom identifier management service.  A typical use of this option would be to allow for login identifiers specific to your organisation to be returned within the result of authentication. In other words, the end user can use their preferred identifier at login, e.g. email address. Freja eID performs the translation to the custom identifier, previously configured by the RP, e.g. employee number or domain login. In such a way, it is straightforward for RPs to map user identifiers to those known within their internal systems, without the need to store this mapping in an internal database or LDAP.

A custom identifier must be unique within the requesting relying party system inside the Freja eID service. In other words, Freja eID does not allow two identical custom attributes to be set by the same RP. In order to set a custom identifier for a user, the RP needs to obtain the existing user information for that user in the Freja eID system (e.g. the email address the user has connected to Freja eID or the social security number, if the user is on the Freja eID+ level) and pass it in the call to Freja eID services. 

**Extension methods**

* `createCustomIdentifier(id,ident)`<br/>Creates a new custom identifier (ident) on an existing identity (id).

* `deleteCustomIdentifier(ident)`<br/>Removes a custom identifier (ident) regardless of the user currently assigned

### Extensions for OrgID

The Freja eID Organisation ID service allows Relying Parties to set a specific, organisation-related identifier to any user. The end user will have previously downloaded the Freja eID mobile application on one or more iOS or Android devices they possess, and registered an account in Freja eID, allowing Relying Parties to refer to them through the use of one or more usernames.

The Organisation ID service is available to end users that have Freja eID Extended (users whose identity has been validated with an ID document) or Plus (users who, in addition to Extended, have had a physical meeting as a further measure of security; this level is only available in Sweden.)

When authenticating a user with Organisational ID the `id_type` of config object should be set to `ORG_ID`

All OrgID functionality requires a additional license/features from Freja eID.

**Adding a organizational id**

The `doRequest` and `initRequest` methods have been extended and supports specifying a `orgid`-object. When a object is specicied the request becomes a request to add a new Organizational ID a user instead of the traditional authentication or signing requests.

 ```javascript
orgid: {
    title: 'id card title',
    name: 'the attribute name',
    value: 'the attribute value'
}
```

**Extensions methods**

* `getOrgIdList()`<br/>Returns a list of all issued Organization ID

* `initSignRequest(id, title, attribute, value)`<br/>Initiates a request to add a new Organizational ID

* `addOrgIdRequest(id, title, attribute, value, [initCallback], [statusCallback])`<br/>Initiates a and returns when completed, support for callbacks.

* `deleteOrgIdRequest(orgId)`<br/>Removes a Organization ID from the user

* `cancelAddOrgIdRequest(requestId)`<br/>Cancells a pending Organization ID issuance
