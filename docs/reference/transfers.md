# Transfers and swap funding

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## sendToAddress

amount is a positive integer in sats. Requires user approval.

**Parameters**

```ts
{ address: string; amount: number }
```

**Returns**

```ts
Promise<{ txid: string }>
```

**Example**

```ts
const { txid } = await client.sendToAddress({ address, amount: 1000 })
```

## sendAsset

Each asset has assetId and atomic-unit amount. bitcoinAmount is BTC sent in sats, not a fee.

**Parameters**

```ts
{ address: string; assets: ArksatAssetTransfer[]; bitcoinAmount?: number }
```

**Returns**

```ts
Promise<{ txid: string }>
```

**Example**

```ts
const { txid } = await client.sendAsset({ address, assets: [{ assetId, amount: '100' }] })
```

## sendSwapFunding

Submits swap funding; does not fetch quotes or complete an entire swap. Wallet Swap is testnet only.

**Parameters**

```ts
ArksatSwapFundingParams
```

**Returns**

```ts
Promise<{ txid: string }>
```

**Example**

```ts
const { txid } = await client.sendSwapFunding(fundingParams)
```

## Swap funding parameters
| Field | Type | Description |
| --- | --- | --- |
| address | string | Recipient |
| assets | ArksatAssetTransfer[] | Atomic-unit amounts |
| bitcoinAmount | number | Integer sats |
| extension | `{ type: number; payload: string }` | Protocol extension |
| timingId | string, optional | Diagnostic correlation |
| expectedAddress / expectedNetwork / expectedSessionId | optional | Session guards |

Check activity before retrying a timed-out submission. [Transfer guide](https://docs.arksat.xyz/en/transfers).

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
