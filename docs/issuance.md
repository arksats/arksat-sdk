# Issue, reissue, and burn

## Issue an asset
```ts
import { createArksatClient, decimalAmountToRaw, waitForArksatProvider } from '@arksat/wallet-sdk'

export async function issueToken() {
  const client = createArksatClient(await waitForArksatProvider())
  const capabilities = await client.getCapabilities()
  if (!capabilities.methods.includes('issueAsset')) {
    throw new Error('Asset issuance is not supported')
  }
  await client.connect({ actions: ['issueAsset'] })
  const session = await client.getWalletSession()
  return client.issueAsset({
    amount: decimalAmountToRaw('1000', 8),
    metadata: { name: 'Example Token', ticker: 'EX', decimals: 8 },
    expectedAddress: session.address,
    expectedNetwork: session.network.network,
    expectedSessionId: session.sessionId,
  })
}
```
Returns `{ assetId, arkTxId }`. The example issues 1000 tokens with 8 decimals.

Amounts are positive uint64 atomic-unit strings. Decimals range from 0 to 18. Metadata is immutable.

Omit `controlAssetId` for fixed supply. To support reissuance, specify an existing control asset at issuance; the API does not create one automatically.

## Reissue and burn
Request the corresponding action permission, then call:
```ts
await client.connect({ actions: ['reissueAsset'] })
const result = await client.reissueAsset({ assetId, amount: '1000' })
```
Use `actions: ['burnAsset']` and `client.burnAsset({ assetId, amount })` to burn.

Both return `{ txid }`. Reissuance requires control-asset ownership; burning requires spendable assets. Each operation requires user confirmation.

[API reference](https://docs.arksat.xyz/en/reference/issuance) · [Permissions](https://docs.arksat.xyz/en/connection)
