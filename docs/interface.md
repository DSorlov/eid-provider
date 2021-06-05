## Module Description

This is the general description of the methods availiable to you.
I'm still struggling a bit to make this really readable in a good way, so perhaps easier to check with the [examples](examples.md).

### Configuration Factory

Configuration factory returns a configuration object, depending on the client it can also accept more arguments depending on the client, see client documentation for more information.

```javascript
const eid = require('eid');
var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
```

If you know some arguments that you want to override already from start you can do so using the `set` object.

```javascript
const eid = require('eid');
var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing', set: { allowFingerprint: false } });
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

```javascript
const eid = require('eid');
var clientList = eid.clientList();
```

**Metadata Object**
* `id` The id used for clientType specs
* `path` The code path for the client
* `authSupported` Boolean, true if Authentication operations are supported
* `signSupported` Boolean, true if Signature operations are supported
* `name` The descriptive name of the client
* `version` The client version
* `author` The client author
* `url` A url provided by the author



### Client Methods

**Main methods**

The main methods are the ones that are implemented in all clients. Clients with more functionallity can contain additonal methods and parameters, this is then documented in the client documentation for each client if so. However this is the basic spec that is guaranteed to be common between all clients. All main methods only accepts objects as arguments.

* `doRequest({id,[text],[statusCallback],[initCallback]})`<br/>Starts a request using id='identity', if text is provided it will be a signing request. Will return when the call is completed or errors out. Will call callbacks if defined to update status.

* `initRequest({id,[text]})`<br/>Starts a request using id='identity' if text is provided it will be a signing request

* `pollRequest({id})`<br/>Gets the status of a request using id='requestid' obtained from initRequest 

* `cancelRequest({id})`<br/>Cancels a pending request using id='requestid' obtained from initRequest 

**Compability methods**

The compability methods are a simpler interface to be more compatible with old implementations and making transitioning to the new version much easier. The compability methods will not support special features of the different clients. The compability methods are not planned for removal but also unlocks a simpler model which are liked by many people.

* `initAuthRequest(id)`

* `initSignRequest(id,text)`

* `pollAuthRequest(requestId)`

* `pollSignRequest(requestId)`

* `cancelAuthRequest(requestId)`

* `cancelSignRequest(requestId)`

* `authRequest(id,[initCallback],[statusCallback])`

* `signRequest(id,text,[initCallback],[statusCallback])`