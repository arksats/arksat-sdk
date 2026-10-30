# Message and transaction signing

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## signMessage

Returns a hex signature. Preserve the original message, whitespace, and line endings. Defaults: ecdsa and utf8.

**Parameters**

```ts
{ message: string; type?: 'ecdsa' | 'schnorr'; encoding?: 'utf8' | 'hex' } & ArksatSessionGuard
```

**Returns**

```ts
Promise<{ signature: string }>
```

**Example**

```ts
const { signature } = await client.signMessage({ message, type: 'schnorr', encoding: 'utf8' })
```

## signTransaction

Signs one PSBT without broadcasting.

**Parameters**

```ts
{ psbtBase64: string; inputIndexes?: number[] } & ArksatSessionGuard
```

**Returns**

```ts
Promise<{ psbtBase64: string }>
```

**Example**

```ts
const signed = await client.signTransaction({ psbtBase64 })
```

## signTransactions

Signs a batch in input order without broadcasting.

**Parameters**

```ts
{ transactions: ArksatSignTransactionParams[] } & ArksatSessionGuard
```

**Returns**

```ts
Promise<{ transactions: { psbtBase64: string }[] }>
```

**Example**

```ts
const signed = await client.signTransactions({ transactions: [{ psbtBase64 }] })
```

The application supplies message and PSBT data. Provider signatures return strings or string arrays; Client results use named fields.

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
