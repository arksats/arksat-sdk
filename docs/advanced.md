# Arkade integration

## Dependencies
```sh
npm install @arkade-os/sdk@0.4.79 @scure/base@2
```

## Create a protocol wallet
```ts
import { createArksatSdkWallet } from '@arksat/wallet-sdk/arkade'
import type { ArksatProvider } from '@arksat/wallet-sdk'
import type { StorageConfig } from '@arkade-os/sdk'

export async function openProtocolWallet(
  provider: ArksatProvider,
  storage: StorageConfig,
) {
  const adapter = await createArksatSdkWallet(provider, {
    expectedNetwork: 'mainnet',
    expectedArkServerUrl: 'https://arkade.computer',
    storage,
  })
  await adapter.assertActive()
  return adapter
}
```
Connect first. Configure the expected service for your deployment; the example uses mainnet.

## Lifecycle
Isolate storage by website origin, account, and network. Call assertActive before protocol operations. Stop work and dispose on locking, disconnection, or account/network changes.

Returns wallet, identity, session, assertActive, and dispose. The adapter verifies that SDK addresses match the extension session.

Automatic settlement and renewal are disabled. Signatures are delegated to the extension. The main SDK entry point does not load Arkade or Chrome APIs.

Validated against Arkade SDK 0.4.79.

## Runtime requirements

The optional Arkade 0.4.79 dependency requires Node 22.12+ below 27 for Node tooling, higher than the core SDK requirement of Node 18+. Core imports do not require these optional peers.
