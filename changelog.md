# Changelog for eid-provider

The format is based on [Keep a Changelog][keep-a-changelog]
<!-- and this project adheres to [Semantic Versioning][semantic-versioning]. -->

## [Unreleased]
- Multi-variable input support takes string or object containing ssn in most modules
- module frejaeid now supports multi country, default is sweden ([SE,NO,FI,DK])
- Added BankID via Funktionstjänster (ftbankid)
- Autostart URL added to ftbankid,gbankid,bankid,ftfrejaeid,frejaeid
- Added Freja eID Organizational IDs
- Changed how to decide module: require('eid-provider')('yourmodule')
- Added involuntary dependency on request for bankid due to soap module. Hope this goes away.

## [0.0.2] (2020-06-06)
- Added BankID via Svensk e-Identitet (gbankid)

## [0.0.1] (2020-06-06)
- Initial commit
- Missing Funktionstjänster and Svensk e-Identitet implementation

[keep-a-changelog]: http://keepachangelog.com/en/1.0.0/
[Unreleased]: https://github.com/DSorlov/eid-provider/compare/master...dev
[0.0.2]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.2
[0.0.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.1