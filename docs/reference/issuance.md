# Issuance, reissuance, and burning

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## issueAsset

amount is a positive uint64 atomic-unit string. metadata contains name, ticker, and decimals (0–18). Returns assetId and arkTxId.

**Parameters**

```ts
ArksatIssueAssetParams
```

**Returns**

```ts
Promise<ArksatIssueAssetResult>
```

**Example**

```ts
const result = await client.issueAsset({ amount: '100000', metadata: { name: 'Example Token', ticker: 'EXM', decimals: 2 } })
```

## reissueAsset

Requires reissuance permission and ownership of the control asset.

**Parameters**

```ts
{ assetId: string; amount: string } & ArksatSessionGuard
```

**Returns**

```ts
Promise<{ txid: string }>
```

**Example**

```ts
const { txid } = await client.reissueAsset({ assetId, amount: '1000' })
```

## burnAsset

Burns a positive atomic-unit amount of a spendable asset.

**Parameters**

```ts
{ assetId: string; amount: string } & ArksatSessionGuard
```

**Returns**

```ts
Promise<{ txid: string }>
```

**Example**

```ts
const { txid } = await client.burnAsset({ assetId, amount: '100' })
```

## Permissions
Request the required actions with connect before calling. Every operation requires confirmation.

Optional controlAssetId refers to an existing control asset; omit for fixed supply. The issue example represents 1000 displayed tokens. [Issuance guide](https://docs.arksat.xyz/en/issuance).

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
