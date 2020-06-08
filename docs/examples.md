## Examples

### Simple example
This is a very simple example of calling authentication via frejaeid for the ssn 200101011212 and when final results are in dump them out on the console.
```javascript
const  eidprovider = require('./eid-provider.js')('frejaeid');  
const  config = eidprovider.settings.testing;
eidprovider.initialize(config);

eidprovider.authRequest('200101011212').then(function(result){
	console.log(result);
});
```

### Simple example with objects as input
Now we are authenticating a norweigan user instead, also it shows of how to send objects as arguments to the functions.
```javascript
const  eidprovider = require('./eid-provider.js')('frejaeid');  
const  config = eidprovider.settings.testing;
eidprovider.initialize(config);

var user = {ssn:'14023526620',country='NO'}

eidprovider.authRequest(user).then(function(result){
	console.log(result);
});
```

### Another simple example in async function
This is a very simple example of calling authentication via bankid for the ssn 200101011212 and when final results are in dump them out on the console, however this time since we are in a async function we could simply use await if needed be.
```javascript
const  eidprovider = require('./eid-provider.js')('bankid');  
const  config = eidprovider.settings.testing;
eidprovider.initialize(config);

const result = await eidprovider.authRequest('200101011212');
console.log(result);
```

### Little more detailed example
This is a build on the simple example where we instead use bankid for the same ssn, the final results are still dumped on the console but we also dump the init and status update messages to the console via callbacks. 
```javascript
function handleInit(status) {
	console.log(status);
}

function handleUpdate(status) {
	console.log(status);
}

const  eidprovider = require('./eid-provider.js')('bankid');  
const  config = eidprovider.settings.testing;
eidprovider.initialize(config);

eidprovider.authRequest('200101011212'}, handleInit, handleUpdate).then(function(result){
	console.log(result);
});
```

### Handling the magic yourself
You can even handle the checks and stuff yourself instead of relying on the internals of the library. Could be useful for some scenarios where you perhaps check for signing in another app etc.. you need to handle loading config and stuff as normal...
```javascript
// This initiates a auth request and returns a id, poll it later to see results.
eidprovider.initAuthRequest('200101011212').then(function(result) {
 doMagicStuff(result);
}

[[..some other code..]]
// This polls for results, use pollSignStatus for a signing status
eidprovider.pollAuthStatus(idfrominit).then(function(result) {
 doEvenMoreMagicStuff(result);
}

[[..some other code..]]
// This ends a session forcefully
eidprovider.cancelAuth(idfrominit);
```

### Supplying custom configuration
It's simple to configure the modules. Just get the default objects and override what you need. Different modules accept different configuration options. Check out the settings object for each module below.
```javascript
const  eidprovider = require('./eid-provider.js')('frejaeid');  
const  config = eidprovider.settings.production;
config.client_cert = fs.readFileSync('supersecret.pfx');
config.password = 'mysupersecretpassword';
eidprovider.initialize(config);
```