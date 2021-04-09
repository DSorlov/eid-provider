![NPM version](https://img.shields.io/npm/v/eid.svg?style=flat)
![stability-stable](https://img.shields.io/badge/stability-beta-red.svg)
![version](https://img.shields.io/badge/version-1.0.0-red.svg)
![maintained](https://img.shields.io/maintenance/yes/2021.svg)
[![maintainer](https://img.shields.io/badge/maintainer-daniel%20sörlöv-blue.svg)](https://github.com/DSorlov)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://img.shields.io/github/license/DSorlov/eid)

| :warning: | This is version 1.0.0-beta.4 and it is NOT intended for production usage.<br/>See earlier versions instead for production usage (v0.2.1). |
| --- | --- |

# eid
This module is developed to enable rapid deployment of identity based authentication for Node.js by creating a common interface to most of the suppliers for official electronic identification and it allows you to mix and match your suppliers. This is a reusability code port of code that I have contributed to [teams-app-eid](https://github.com/DennizSvens/teams-app-eid) with some smart addons and international support.

### Simple to use

Regardless of which backend service you use the basic usage is the same. Some backends require more configuration than others. However the classes expose same interface and responses so code is easy to use. You can read details of the [interface](docs/interface.md) or see some [more practical examples](docs/examples.md)   

```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.doRequest({id: '200101011212'}).then(function(endResult){
    console.log(endResult)
});
```

or the more backwards compatible

```javascript
const eid = require('eid');

var config = eid.configFactory({clientType: 'frejaeid', enviroment: 'testing'});
var client = eid.clientFactory(config);

client.authRequest('200101011212').then(function(endResult) {
    console.log(endResult)
});
```

### Built-in clients

Clients are the classes that manage communication with the backend services. The library supports a bunch of clients out of the box, but additional clients can easily be added to make sure that the one interface strategy works.

| Client | ID Types | Vendor | Authentication | Signing | Markets |
| --- | --- | --- | --- | --- | --- |
| [FrejaEID](clients/frejaeid/readme.md) | Freja eID | Freja eID AB | :heavy_check_mark: | :heavy_check_mark: | :sweden: :denmark: :norway: :finland: |
| [BankID](clients/bankid/readme.md) | BankID | Finansiell ID-Teknik AB | :heavy_check_mark: | :heavy_check_mark: | :sweden: |
| [GRP2](clients/grp2/readme.md) | Freja eID, BankID | Funktionstjänster/CGI | :heavy_check_mark: | :heavy_check_mark: | :sweden: |
| [GrandID](clients/grandid/readme.md) | Freja eID, BankID, Mobile SiTHS | Svensk E-Identitet AB | :heavy_check_mark: | :heavy_check_mark: | :sweden: |
| [Signicat](clients/signicat/readme.md) | BankID | Signicat | :heavy_check_mark: |  | :sweden: |
| [IDKollen](clients/idkollen/readme.md) | BankID | IDkollen i Sverige AB | :heavy_check_mark: | :heavy_check_mark:  | :sweden: |


The configuration options should be quite obvious as what they do. If you are unsure your supplier will most probably be able to determine what information you need. Most modules have sane values, certificates etc for most testing services and production services however there is no production credentials and you need to strike an agreement with the services yourself to obtain these.
