# Publishing SDK 0.1.0

Run these commands from the SDK repository root. Use Node 22.12 or newer, below 27, for the full build with the optional Arkade 0.4.79 dependency. Core consumer tooling supports Node 18+.

## Verify and pack

```sh
npm ci --ignore-scripts
npm test
npm run check
npm pack
```

The build compiles the core, mock, conformance and optional Arkade entries. Tests cover permission enforcement, exact mock balances, context changes, transaction lookup, wait cleanup, error guards, precision checks and timer validation. Documentation checks verify English content, local links, version and license metadata. The prepack hook rebuilds and checks the package before creating `arksat-wallet-sdk-0.1.0.tgz`.

Run the browser example with `npm run example`. It defaults to a mock wallet. Validate actual extension behavior and a small test-network transfer separately before making production-payment claims.

## Inspect the archive

```sh
npm publish ./arksat-wallet-sdk-0.1.0.tgz --dry-run --ignore-scripts --access public --registry https://registry.npmjs.org/
```

Inspect the file list and test the exact archive in a clean consumer project before publishing. Compute a SHA-256 checksum and distribute it with that same archive. Repository metadata and documentation changes can change the archive checksum even when the SDK version stays the same; use the checksum for the archive being delivered.

## Publish to npm

Ensure your npm account can publish to the `@arksat` scope and version 0.1.0 is unused. After release approval, publish the tested archive:

```sh
npm publish ./arksat-wallet-sdk-0.1.0.tgz --ignore-scripts --access public --registry https://registry.npmjs.org/
```

This command publishes publicly. Publishing a Git commit does not publish the npm package. Do not share npm credentials in chat.

## Coordinate availability

The online Chinese and English documentation has been synchronized to SDK 0.1.0. After npm publication, update archive-only installation instructions and verify the installed public package. Keep the version, API reference, method contracts, types and checksum guidance synchronized.

The SDK repository and package are English-only, including comments, examples and guides. Chinese documentation is maintained separately at the documentation website.

Provider API and events remain version 2. Direct transaction lookup requires the extension to advertise `getTransaction`; the matching local extension build is 1.0.32. Older providers without the convenience method keep the latest-100 fallback in `waitForTransaction`. An extension build number does not claim Chrome Web Store publication. Extension and documentation deployments are separate releases.
