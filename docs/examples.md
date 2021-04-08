## Examples

### Simple authentication example (frejaeid)
This is a very simple example of calling authentication via frejaeid for the ssn 200101011212 and when final results are in dump them out on the console.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.doRequest({id:'200101011212'}).then(function(result){
	console.log(result);
});
```

### Simple authentication example (frejaeid using compat method)
This is a very simple example of calling authentication via frejaeid for the ssn 200101011212 and when final results are in dump them out on the console.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.authRequest('200101011212').then(function(result){
	console.log(result);
});
```

### Simple signing example (bankid)
This is a very simple example of calling signing via bankid for the ssn 200101011212 and when final results are in dump them out on the console.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.doRequest({id:'200101011212',text:'text to sign'}).then(function(result){
	console.log(result);
});
```

### Simple signing example (bankid using compat method)
This is a very simple example of calling authentication via frejaeid for the ssn 200101011212 and when final results are in dump them out on the console.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.signRequest('200101011212','text to sign').then(function(result){
	console.log(result);
});
```

### Simple example with objects as input (frejaeid)
Now we are authenticating a norweigan user instead, also it shows of how to send objects as arguments to the functions.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
var client = eid.clientFactory(config);

var user = {ssn:'14023526620',country='NO'}

client.doRequest({id: user}).then(function(result){
	console.log(result);
});
```

### Another simple example in async function (bankid)
This is a very simple example of calling authentication via bankid for the ssn 200101011212 and when final results are in dump them out on the console, however this time since we are in a async function we could simply use await if needed be.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
var client = eid.clientFactory(config);

const result = await client.doRequest({id:'200101011212'});
console.log(result);
```

### Little more detailed example (bankid)
This is a build on the simple example where we instead use bankid for the same ssn, the final results are still dumped on the console but we also dump the init and status update messages to the console via callbacks. 
```javascript
function handleInit(status) {
	console.log(status);
}

function handleUpdate(status) {
	console.log(status);
}

const eid = require('eid');

var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.doRequest({id:'200101011212',initCallback=handleInit,statusCallback=handleUpdate}).then(function(result){
	console.log(result);
});
```

### Handling the magic yourself
You can even handle the checks and stuff yourself instead of relying on the internals of the library. Could be useful for some scenarios where you perhaps check for signing in another app etc.. you need to handle loading config and stuff as normal... 
```javascript
// This initiates a auth request and returns a id, poll it later to see results.
client.initRequest({id:'200101011212'}).then(function(result) {
 doMagicStuff(result);
}

[[..some other code..]]
// This polls for results, use pollSignStatus for a signing status
client.pollStatus({id: <idfrominit>}).then(function(result) {
 doEvenMoreMagicStuff(result);
}

[[..some other code..]]
// This ends a session forcefully
client.cancelRequest({id: <idfrominit>);
```

### Supplying custom configuration
It's simple to configure the modules. Just get the default objects and override what you need. Different modules accept different configuration options. Check out the settings object for each module below.
```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'bankid', enviroment: 'testing'});
config.client_cert = fs.readFileSync('supersecret.pfx');
config.password = 'mysupersecretpassword';

var client = eid.clientFactory(config);
```