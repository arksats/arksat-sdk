# Distribution and checksums

SDK 0.1.0 is published as [@arksat/wallet-sdk](https://www.npmjs.com/package/@arksat/wallet-sdk). Install the exact version:

```sh
npm install @arksat/wallet-sdk@0.1.0
```

Download the published archive with `npm pack @arksat/wallet-sdk@0.1.0 --ignore-scripts`. In PowerShell, compute its SHA-256:

```powershell
Get-FileHash ./arksat-wallet-sdk-0.1.0.tgz -Algorithm SHA256
```

A matching checksum detects a mismatched download; it does not establish publisher identity. Use a trusted release source.

The package uses the MIT license and includes the complete [browser example](developer-tools.md). Its source, comments, examples and included documentation are English-only. Chinese documentation is available on the documentation website.

Extension ZIP files are separate deliverables. Direct transaction lookup requires an extension that advertises getTransaction. See the [release instructions](releasing.md) for maintainer commands.

## Published archive checksum

```text
3234c39ebf53a6941d66d07344040b46e49b159a0b1abc9bd00019b4b00e4723  arksat-wallet-sdk-0.1.0.tgz
```

This checksum belongs to the immutable npm archive. Earlier local development archives can have different checksums. Running npm pack from a later source checkout creates a new local archive and does not replace the published version.
