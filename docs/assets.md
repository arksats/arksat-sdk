# Balances and assets

## Portfolio
```ts
import type { ArksatClient } from '@arksat/wallet-sdk'

export async function loadPortfolio(client: ArksatClient) {
  const [balance, assets] = await Promise.all([
    client.getBalance(),
    client.getAssets(),
  ])
  return { availableSats: balance.available, assets }
}
```

| Field | Meaning |
| --- | --- |
| balance.available / total | Available / total BTC in integer sats |
| balance.assets | Token holdings |
| balance.availableAssets | Spendable token amounts |
| asset.amount / rawAmount | Exact atomic-unit strings |
| asset.displayAmountText | Optional exact decimal text |
| asset.displayAmount | Approximate display value |
| asset.metadataPending | Metadata or decimals are not yet authoritative |

## Asset lookup
`getAssetDetails({ assetId })` searches current holdings and returns an asset or null. Null does not indicate global nonexistence.

`getAssetMetadata({ assetId })` queries the current network indexer, including assets not held by the wallet. It returns `assetId`, exact `supply`, optional metadata, and optional controlAssetId.

## Precision
Use atomic units for transactions. If metadata is pending or decimals are unknown, show explicitly labelled raw units. Do not assume 8 decimals.

After a balance or asset event, reload data and verify that the account and network have not changed before updating the UI.

[Amount conversion](https://docs.arksat.xyz/en/amounts) · [API reference](https://docs.arksat.xyz/en/reference/assets)
