# Changelog for eid

The format is based on [Keep a Changelog][keep-a-changelog]
<!-- and this project adheres to [Semantic Versioning][semantic-versioning]. -->

## [1.1.1] (2024-07-16)

### Fixed
- Freja eID orgID getAll function API change implemented
- Freja eID orgID getAll RP-id was broken
- Freja eID Fixed when no extra attributes are present in response

## [1.1.0] (2024-02-25)

### Removed
- Removed old certificates from frejaeid
- Fixed versioning missmatch

### Fixed
- Freja eID Photo seems broken but implemented the filehash
- Freja eID Covid Certificates feature removed
- Broken bankid qr-code generation have been fixed

### Changes
- In Freja eID both email and phone number object arrays have been flattened to string arrays

## [1.0.3] (2023-05-26)

### Added
- Fixed error handling in baseclient.js

## [1.0.2] (2023-04-05)

### Added
- Added support for integrator features for frejaeid
- Changed keybag to AES-256-CBC for frejaeid test key

## [1.0.1] (2023-03-22)

### Added
- Updates to support new attributes in frejaeid
- New certificates to support rollover in 2023
- Bumped jsonwebtoken to 9.0.0

### Notable changes
- Field names in frejaeid under extras have been normalized
- Versions under 1.0.0 are no longer supported for security updates

## [1.0.0] (2021-06-05)

### Breaking changes
- Package name changed from eid-provider to eid
- Major rehauling of architechture and internal file locations
- Completely new interface for all operations
- Compability calls implemented to make transition easier to eid
- frejaeid and frejaorgid have been merged into one client frejaeid
- ftbankid and ftfrejaeid have been merged into new client grp2
- gbankid, bfrejaeid and ghsaid have been merged into new client grandid
- Implemented new client signicat
- Reduced external dependencies, now only jsonwebtoken is required.
- Implemented support for QR-codes (API v5.1) in bankid

## [0.2.1] (2021-04-08)

### Added
- Implemented phone_numbers collection from authentication (frejaeid,frejaorgid)

### Fixed
- Fixed fatal bug in code for signing (frejaeid)
- Updated xmldom to remove security issues in the soap library

## [0.2.0] (2021-02-12)

### Fixed
- Documentation updates
- Added security policy
- Bumped axios

## [0.1.9] (2020-12-08)

### Added
- Implementing getAll (frejaorgid)

### Fixed
- Fix for deferred authentication failing with signature failure (frejaeid)
- Fixed broken creation data return if created by other than SSN (frejaorgid)
- Fixed missing DEFERRED as datatype (frejaorgid,frejaeid)

## [0.1.8] (2020-11-24)

### Fixed
- Updated dependency versions for lodash due to security issues in that library
- Updated dependency versions for xml-crypto due to security issues in that library

## [0.1.7] (2020-09-02)

### Added
- Added IDKollen API provider (idkbankid)

### Fixed
- Added error handling on internal errors when following requests, should create more stable library (all modules).
- Verified API and updated settings for Funktionstjänster (CGI) Freja eID module (ftfrejaeid)

## [0.1.5] (2020-09-01)

### Fixed
- Changed included certificate for bankid-test

## [0.1.4] (2020-07-06)

### Fixed
- Fixed broken handing of objects into frejaeid and frejaorgid
- Fixed broken default certificates for production in frejaeid and frejaorgid

## [0.1.3] (2020-07-01)

### Breaking Changes
- Renamed ssn in output object to id which is more universal due to HSA-id and Freja OrgID which can ingest and send out other forms of id and to prepare for any additional forms of other identity types that we wish to invoke. Currently only in use by frejaeid, frejaorgid and ghsaid.

### Added
- General support for extra functions in modules 
- Added support for SITHS ID via GrandID by Svensk e-Identitet (ghsaid)
- Freja OrgID functions for creating/deleting organizational ids created (frejaorgid)
- Added more options for invocation and data results for Freja eID (frejaeid)
- Added support for adding and removing CUSTOM_IDENTIFIERs. (frejaeid)
- Multiple certificates to validate freja eid jwt (frejaeid, frejaorgid)

### Fixed
- Fixed bug in Freja OrgID preventing successfull verification during certain conditions.
- Fixed default testing config for ftfrejaeid
- Fixed unpacking in frejaeid and cases where errors where treated as successes

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
[1.0.1]: https://github.com/DSorlov/eid-provider/releases/tag/v1.0.0
[1.0.0]: https://github.com/DSorlov/eid-provider/releases/tag/v1.0.0
[0.2.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.2.1
[0.2.0]: https://github.com/DSorlov/eid-provider/releases/tag/v0.2.0
[0.1.9]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.9
[0.1.8]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.8
[0.1.7]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.7
[0.1.5]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.5
[0.1.4]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.4
[0.1.3]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.3
[0.1.2]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.2
[0.1.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.1
[0.1.0]: https://github.com/DSorlov/eid-provider/releases/tag/v0.1.0
[0.0.2]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.2
[0.0.1]: https://github.com/DSorlov/eid-provider/releases/tag/v0.0.1