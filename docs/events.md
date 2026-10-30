# Events and transaction status

## Subscribe
```ts
import { subscribe, type ArksatProvider } from '@arksat/wallet-sdk'

export function watchWallet(provider: ArksatProvider, refresh: () => void) {
  const stops = [
    subscribe(provider, 'balance:changed', refresh),
    subscribe(provider, 'assets:changed', refresh),
    subscribe(provider, 'account:changed', refresh),
    subscribe(provider, 'network:changed', refresh),
    subscribe(provider, 'wallet:locked', refresh),
    subscribe(provider, 'connection:disconnected', refresh),
  ]
  return () => stops.forEach(stop => stop())
}
```
Reload state after events. Clear account data when locked or disconnected. Prevent old requests from overwriting the new account or network.

| Event | Payload |
| --- | --- |
| account:changed | string[] |
| network:changed | mainnet or mutinynet |
| balance:changed / assets:changed | ArksatDataEvent or null |
| transaction:updated / transfer:received / transfer:settled | ArksatTransactionEvent |
| connection:connected | Empty object |
| connection:disconnected | message field |
| wallet:locked / wallet:unlocked | null |

Events version 2 uses colon-separated names. Legacy event names are not supported.

## History
```ts
await client.connect({ read: ['transactions'] })
const history = await client.getTransactionHistory({ limit: 50, offset: 0 })
```
Newest first; limit 1–100, default 50; offset defaults to 0. Deduplicate pages by ID because new records can shift offsets.

## Wait for a transaction
```ts
import { waitForTransaction } from '@arksat/wallet-sdk'
const tx = await waitForTransaction(provider, txid, { signal })
```
Requires transaction-history permission. Uses getTransaction to search all activity retained by the wallet. Older providers without getTransaction fall back to the latest 100 records. Defaults to a 120-second timeout and 3-second polling.

Returns any non-pending record, including failed, cancelled, and recoverable; inspect status. Context changes and read errors reject the wait. Timeout does not cancel or resend the transaction.

Wallet notifications are not payment proofs. Verify merchant payments independently for the corresponding rail.
