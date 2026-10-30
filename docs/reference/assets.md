# Balances and assets

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## getBalance

BTC values are integer sats. available is spendable; total includes other holdings.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatBalance>
```

**Example**

```ts
const balance = await client.getBalance()
```

## getAssets

Returns held assets. rawAmount is exact; use displayAmountText for exact display.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatAssetBalance[]>
```

**Example**

```ts
const assets = await client.getAssets()
```

## getAssetDetails

Searches current holdings. Null does not indicate global nonexistence.

**Parameters**

```ts
{ assetId: string }
```

**Returns**

```ts
Promise<ArksatAssetBalance | null>
```

**Example**

```ts
const asset = await client.getAssetDetails({ assetId })
```

## getAssetMetadata

Returns metadata, supply, and optional control-asset information.

**Parameters**

```ts
{ assetId: string }
```

**Returns**

```ts
Promise<ArksatAssetDetails>
```

**Example**

```ts
const metadata = await client.getAssetMetadata({ assetId })
```

## Units
Token transaction amounts are atomic-unit strings. Check metadataPending and verified decimals before accepting decimal input. [Amounts](https://docs.arksat.xyz/en/amounts).

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
