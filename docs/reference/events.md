# Events and history

## getTransactionHistory
Parameters: optional limit (1–100; default 50) and offset (default 0). Returns `Promise<ArksatTransaction[]>`. Requires transactions read permission.
```ts
await client.connect({ read: ['transactions'] })
const rows = await client.getTransactionHistory({ limit: 20, offset: 0 })
```
Records are newest first. Offset pagination is not a stable snapshot.

## on / off
```ts
const listener = (network: 'mainnet' | 'mutinynet') => console.log(network)
provider.on('network:changed', listener)
provider.off('network:changed', listener)
```

| Event | Payload |
| --- | --- |
| account:changed | string[] |
| network:changed | ArksatNetwork |
| balance:changed / assets:changed | ArksatDataEvent or null |
| transaction:updated / transfer:received / transfer:settled | ArksatTransactionEvent |
| connection:connected | Empty object |
| connection:disconnected | message field |
| wallet:locked / wallet:unlocked | null |

## subscribe
```ts
import { subscribe } from '@arksat/wallet-sdk'
const stop = subscribe(provider, 'balance:changed', () => {
  // Reload balance
})
stop()
```
Returns an idempotent unsubscribe function.

## waitForTransaction
```ts
import { waitForTransaction } from '@arksat/wallet-sdk'
const tx = await waitForTransaction(provider, txid, {
  timeoutMs: 120000,
  pollIntervalMs: 3000,
})
```
Returns `Promise<ArksatTransaction>`. Optional AbortSignal is supported. Default timeout: 120 seconds; polling: 3 seconds, minimum 1 second.

Uses getTransaction to search all activity retained by the wallet and returns any non-pending status. Older providers without getTransaction fall back to only the latest 100 records. Check status for failed, cancelled, or recoverable results. Context changes and read errors reject.

[Integration guide](https://docs.arksat.xyz/en/events) · [Types](https://docs.arksat.xyz/en/reference/types)
