## Module Description

This is the general description of the methods availiable to you.
I'm still struggling a bit to make this really readable in a good way, so perhaps easier to check with the [examples](examples.md).

### Configuration Factory

Configuration factory returns a configuration object.

```javascript
const eid = require('eid');
var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
```

### Client Factory

Client factory returns a client for communicating with a backend service. The configuration object that is used to create the client must contain configuration for that client (see documentation for respective client), but must atleast contain `clientType` property that describes what client should be created.

```javascript
const eid = require('eid');
const config = {clientType='frejaeid'};
var client = eid.clientFactory(config);
```

### Client Indexer

The Client Indexer returns a array of objects describing clients that are installed and usefull metadata about the client.

**Metadata Object**
* `id` The id used for clientType specs
* `path` The code path for the client
* `authSupported` Boolean, true if Authentication operations are supported
* `signSupported` Boolean, true if Signature operations are supported
* `name` The descriptive name of the client
* `version` The client version
* `author` The client author
* `url` A url provided by the author

```javascript
const eid = require('eid');
var clientList = eid.clientList();
```

### Client Methods

**Main methods**
The main methods are the ones that are implemented in all clients. Clients with more functionallity can contain additonal methods and parameters, this is then documented in the client documentation for each client if so. However this is the basic spec that is guaranteed to be common between all clients. All main methods only accepts objects as arguments.

`doRequest({id,method,[text],[statusCallback],[initCallback]})` Starts a request using id='identity' and method='auth' or 'sign'. If method='sign' then text='text to sign'. Will return when the call is completed or errors out. Will call callbacks if defined to update status.
also must be supplied.

`initRequest({id,method,[text]})` Starts a request using id='identity' and method='auth' or 'sign'. If method='sign' then text='text to sign' 

`pollRequest({id})` Gets the status of a request using id='requestid' obtained from initRequest 

`cancelRequest({id})` Cancels a pending request using id='requestid' obtained from initRequest 

**Compability methods**
The compability methods are a simpler interface to be more compatible with old implementations and making transitioning to the new version much easier. The compability methods will not support special features of the different clients. The compability methods are not planned for removal but also unlocks a simpler model which are liked by many people.

`initAuthRequest(id)` Alias for initRequest

`initSignRequest(id,text)` Alias for initRequest

`pollAuthRequest(requestId)` Alias for pollRequest

`pollSignRequest(requestId)` Alias for pollRequest

`cancelAuthRequest(requestId)` Alias for cancelRequest

`cancelSignRequest(requestId)` Alias for cancelRequest

`authRequest(id,[initCallback],[statusCallback])` Alias for followRequest

`signRequest(id,text,[initCallback],[statusCallback])` Alias for followRequest