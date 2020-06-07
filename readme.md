[![stability-stable](https://img.shields.io/badge/stability-prerelease-lightgrey.svg)](#)
[![version](https://img.shields.io/badge/version-0.0.3-green.svg)](#)
[![maintained](https://img.shields.io/maintenance/yes/2020.svg)](#)
[![maintainer](https://img.shields.io/badge/maintainer-daniel%20sörlöv-blue.svg)](https://github.com/DSorlov)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://img.shields.io/github/license/DSorlov/eid-provider)

# eid-provider
This module is developed to enable rapid deployment of identity based authentication for Node.js by creating a common interface to most of the suppliers for official electronic identification and it allows you to mix and match your suppliers. This is a reusability code port of code that I have contributed to [teams-app-eid](https://github.com/DennizSvens/teams-app-eid) with some smart addons and international support.

### Simple to use

There is only one way of interfacing the modules regardles of which module. You can read details of the [methods](docs/methods.md) or see some [more examples](docs/examples.md)

```javascript
const  eidprovider = require('./eid-provider.js')('frejaeid');  
const  config = eidprovider.settings.testing;
eidprovider.initialize(config);

eidprovider.authRequest('200101011212').then(function(result){
	console.log(result);
});
```

### Supported modules

There are basically right now two main types of integrations: one is working directly with the service apis and the other kind is working with a broker service. The broker services can be usefull if you have many integrations or other sources in your enterprise and you wish to use the same sources for these.

| Module | Vendor | Authentication | Signing | Geographies | Readiness |
| --- | --- | --- | --- | --- | --- |
| [bankid](docs/bankid.md) | BankID | :heavy_check_mark: | :heavy_check_mark: | :sweden: | Production ready |
| [frejaeid](docs/frejaeid.md) | Verisec (Freja eID) | :heavy_check_mark: | :heavy_check_mark: | :sweden: :denmark: :norway: :finland: | Production ready |
| [frejaorgid](docs/frejaorgid.md) | Verisec (Freja eID) | :heavy_check_mark: | :heavy_check_mark: | :sweden: :denmark: :norway: :finland: | Production ready |
| [ftbankid](docs/ftbankid.md) | Funktionstjänster (CGI) | :heavy_check_mark: | :heavy_check_mark: | :sweden: | Production ready |
| [ftfrejaeid](docs/ftfrejaeid.md) | Funktionstjänster (CGI) | :heavy_check_mark: | :heavy_check_mark: | :sweden: :denmark: :norway: :finland: | Not recomended* |
| [gbankid](docs/gbankid.md) | Svensk e-Identitet | :heavy_check_mark: | :heavy_check_mark: | :sweden: | Not recomended** |
| [gfrejaeid](docs/gfrejaeid.md) | Svensk e-Identitet | :x: | :x: | :sweden: | Not recomended*** |

<sup>* The API key we have been supplied with does not allow for freja authentication so largely untested but complies with api.<br/>
** The GrandID keys we have got for testing have stopped working so have not been tested.<br/>
*** GrandID do not officially support Freja eID for silent logins. Using some ugly workarounds tbh, so not for production I think.
</sup>

The configuration options should be quite obvious as what they do. If you are unsure your supplier will most probably be able to determine what information you need. Most modules have sane values, certificates etc for most testing services and production services however there is no production credentials and you need to strike an agreement with the services yourself to obtain these.


