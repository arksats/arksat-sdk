# Connection and permissions

## Connection
`connect()` grants basic account, network, balance, and asset reads. Signing, sending, and switching networks require user confirmation.

| Feature | Additional connect option |
| --- | --- |
| Transaction history | `read: ['transactions']` |
| Issue assets | `actions: ['issueAsset']` |
| Reissue assets | `actions: ['reissueAsset']` |
| Burn assets | `actions: ['burnAsset']` |

```ts
await client.connect({ actions: ['issueAsset'] })
```
Request only the permissions your application needs. Existing valid grants do not prompt again; adding permissions requires approval. Each asset operation still requires confirmation.

## State
`getProviderState()` returns `isConnected`, `isUnlocked`, `accounts`, and `network`. An unauthorized website receives a null network and no accounts. Locked wallets do not expose accounts.

## Switch networks
```ts
await client.switchNetwork({ network: 'mutinynet' })
const state = await client.getProviderState()
```
Supported networks: `mainnet` and `mutinynet`. After switching, reload state and rebuild protocol clients. Switching to the current network is a no-op.

## Sessions
`getWalletSession()` returns a coherent public snapshot with addresses, public key, network, and Arkade configuration.

Discard sessions after locking, disconnecting, or account, network, script, or background changes. Supported signing and asset operations accept `expectedAddress`, `expectedNetwork`, and `expectedSessionId`.

## Disconnect
```ts
await client.disconnect()
```
Remove [event subscriptions](https://docs.arksat.xyz/en/events) when the component or page is disposed.
