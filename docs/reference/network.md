# Networks and sessions

Use `client = createArksatClient(provider)`. Example variables are supplied by the application.

## getCapabilities

Returns protocol versions, methods, events, networks, and signature types.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatCapabilities>
```

**Example**

```ts
const capabilities = await client.getCapabilities()
```

## getProviderState

Returns connection, unlock, account, and network state.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatProviderState>
```

**Example**

```ts
const state = await client.getProviderState()
```

## getNetwork

Returns the current network and Arkade service information.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatNetworkInfo>
```

**Example**

```ts
const network = await client.getNetwork()
```

## getWalletSession

Returns an atomic public session. Read the Bitcoin boarding address from boardingAddress.

**Parameters**

```ts
// No parameters
```

**Returns**

```ts
Promise<ArksatWalletSession>
```

**Example**

```ts
const session = await client.getWalletSession()
```

## switchNetwork

Requests a network switch. Reload state after completion. Switching to the current network is a no-op.

**Parameters**

```ts
{ network: 'mainnet' | 'mutinynet' }
```

**Returns**

```ts
Promise<void>
```

**Example**

```ts
await client.switchNetwork({ network: 'mutinynet' })
```

## Session guards
Supported operations accept expectedAddress, expectedNetwork, and expectedSessionId. [Session lifecycle](https://docs.arksat.xyz/en/connection).

[Errors](https://docs.arksat.xyz/en/errors) · [Type definitions](https://docs.arksat.xyz/en/reference/types)
