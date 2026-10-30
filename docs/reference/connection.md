# Connection and accounts

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## connect

Requests connection or additional permissions. read accepts transactions; actions accepts issueAsset, reissueAsset, and burnAsset.

**Parameters**

```ts
input?: ArksatConnectOptions
```

**Returns**

```ts
Promise<{ accounts: string[] }>
```

**Example**

```ts
const { accounts } = await client.connect()
```

## disconnect

Disconnects the requesting website.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<void>
```

**Example**

```ts
await client.disconnect()
```

## Provider account methods
Call directly on provider:

| Method | Result |
| --- | --- |
| isConnected() | Promise boolean |
| getAccounts() | Promise string array |
| getAddress() | Promise string |
| getPublicKey() | Promise string |
| requestAccounts() | Alias of connect; Promise string array |

Provider connect returns an address array; Client connect returns an accounts object. [Permissions](https://docs.arksat.xyz/en/connection).

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
