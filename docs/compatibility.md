# Versions and compatibility

| Component | Version |
| --- | --- |
| Local extension build | 1.0.32 |
| Wallet SDK | 0.1.0 |
| Provider API | 2 |
| Events | 2 |
| Optional Arkade SDK | 0.4.79 |

Use getCapabilities to check methods and protocol versions.

## SDK 0.1.0

- getTransaction searches retained activity without the 100-record pagination limit; the transactions grant is still required.
- waitForTransaction prefers direct lookup; older providers keep the latest-100 fallback.
- Separate /mock and /conformance exports and a runnable browser example.
- isArksatProviderError handles cross-bundle and structured-cloned errors.
- English method contracts, types, examples and distribution checks; Chinese guides are maintained outside the SDK package.

SDK 0.1.0 is published on npm. Extension 1.0.32 is a local build version and does not claim Chrome Web Store publication. Provider API and events remain version 2. Check getCapabilities().methods before calling new methods.

## Versioning

0.1.0 is the initial public npm version. Earlier local archive version labels were development builds and do not imply prior npm releases.
