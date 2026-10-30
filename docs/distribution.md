# Distribution and checksums

SDK 0.1.0 is distributed as arksat-wallet-sdk-0.1.0.tgz. It has not been published to npm. Obtain the archive and SHA256SUMS from the same release delivery, then install the archive locally:

```sh
npm install ./arksat-wallet-sdk-0.1.0.tgz
```

On PowerShell, compare the archive hash with SHA256SUMS:

```powershell
Get-FileHash ./arksat-wallet-sdk-0.1.0.tgz -Algorithm SHA256
```

A matching checksum detects a mismatched download; it does not establish publisher identity. Use a trusted release source.

The package uses the MIT license and includes the complete [browser example](developer-tools.md). Its source, comments, examples and included documentation are English-only. Chinese documentation is available on the documentation website.

Extension ZIP files are separate deliverables. Direct transaction lookup requires an extension that advertises getTransaction. See the [release instructions](releasing.md) for maintainer commands.
