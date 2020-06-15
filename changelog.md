# Changelog for eid-provider

The format is based on [Keep a Changelog][keep-a-changelog]
<!-- and this project adheres to [Semantic Versioning][semantic-versioning]. -->

## [Unreleased]
- Fixed default testing config for ftfrejaeid

## [0.1.3] (2020-06-10)

### Breaking Changes
- Renamed ssn in output object to id which is more universal due to HSA-id and Freja OrgID which can ingest and send out other forms of id and to prepare for any additional forms of other identity types that we wish to invoke. Currently only in use by frejaeid, frejaorgid and ghsaid.

### Added
- General support for extra functions in modules 
- Added support for SITHS ID via GrandID by Svensk e-Identitet (ghsaid)
- Freja OrgID functions for creating/deleting organizational ids created (frejaorgid)
- Added more options for invocation and data results for Freja eID (frejaeid)
- Added support for adding and removing CUSTOM_IDENTIFIERs. (frejaeid)

### Fixed
- Fixed bug in Freja OrgID preventing successfull verification during certain conditions.

## [0.1.2] (2020-06-09)
- Fixed broken authentication (gbankid, gfrejaeid) for Svensk e-Idenitet

## [0.1.1] (2020-06-08)
- Fixed broken paths in the module
- Fixed broken implementation in gbankid

## [0.1.0] (2020-06-08)
- Multi-variable input support takes string or object containing ssn in most modules
- module frejaeid now supports multi country, default is sweden ([SE,NO,FI,DK])
- Added BankID via Funktionstjänster (ftbankid)
- Autostart URL added to ftbankid,gbankid,bankid,ftfrejaeid,frejaeid
- Added Freja eID Organizational IDs
- Changed how to decide module: require('eid-provider')('yourmodule')
- Added involuntary dependency on request for bankid due to soap module. Hope this goes away.
- Restructured documentation and added a bit of usefull stuff to it
- Moved the location of modules into the modules sub-folder
- Completed gfrejaeid

## [0.0.2] (2020-06-06)
- Added BankID via Svensk e-Identitet (gbankid)

## [0.0.1] (2020-06-06)
- Initial commit
- Missing Funktionstjänster and Svensk e-Identitet implementation

[keep-a-changelog]: http://keepachangelog.com/en/1.0.0/
[Unreleased]: https://github.com/DSorlov/eid-provider/compare/master...dev
[0.1.3]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.3
[0.1.2]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.2
[0.1.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.1
[0.1.0]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.0
[0.0.2]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.2
[0.0.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.1