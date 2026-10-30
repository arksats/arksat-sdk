# Install and connect

## Install
Install and enable the [Arksat extension](https://chromewebstore.google.com/detail/arksat-wallet/oebdijiadpemhganjpfnaemjcdepijdj). Refresh websites opened before installation.

SDK 0.1.0 is distributed as a package archive and is not published to npm:
```sh
npm install ./arksat-wallet-sdk-0.1.0.tgz
```

## Connect
Call from a user action:
```ts
import { createArksatClient, waitForArksatProvider } from '@arksat/wallet-sdk'

export async function connectWallet() {
  const provider = await waitForArksatProvider({ timeoutMs: 5000 })
  const client = createArksatClient(provider)
  const capabilities = await client.getCapabilities()
  if (capabilities.apiVersion !== 2) throw new Error('Update Arksat Wallet')
  const { accounts } = await client.connect()
  const [network, balance] = await Promise.all([
    client.getNetwork(),
    client.getBalance(),
  ])
  return { client, accounts, network, balance }
}
```

Handle rejection and errors at the call site. Provider detection does not grant website permissions.

## Build from source
From the SDK repository root after installing dependencies:
```sh
npm run build
npm pack
```

## Direct Provider access
SDK installation is optional:
```ts
import type { ArksatProvider } from '@arksat/wallet-sdk'

export async function connectProvider(provider: ArksatProvider) {
  return provider.connect()
}
```
Provider `connect()` returns an address array. Client `connect()` returns `{ accounts }`.

[Connection and permissions](https://docs.arksat.xyz/en/connection) · [API reference](https://docs.arksat.xyz/en/api)
