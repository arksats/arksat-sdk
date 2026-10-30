# Developer tools and complete example

These tools ship with SDK 0.1.0. They are separate exports; importing the main SDK does not load a mock wallet or run diagnostics.

## Run the browser example

From the SDK repository:

```sh
npm run build
npm run example
```

After installing the SDK archive in another project:

```sh
node node_modules/@arksat/wallet-sdk/examples/serve.mjs
```

Open http://127.0.0.1:4174. The page defaults to a mock wallet: connect, send, and press the mock confirmation button. It demonstrates capability checks, explicit history permissions, named results, status queries, cancellation, subscription cleanup, and context changes.

To use a real extension, turn off the mock option before connecting and enter a real destination. This mode requests wallet approval and moves real funds. The extension must advertise getTransaction. A returned txid means submission, not settlement. Failed, cancelled, and recoverable results have their own messages. The example never automatically retries a payment.

## Mock provider

```ts
import { createArksatClient, waitForTransaction } from '@arksat/wallet-sdk'
import { createMockProvider } from '@arksat/wallet-sdk/mock'

const provider = createMockProvider({ balance: 10000 })
const client = createArksatClient(provider)
await client.connect({ read: ['transactions'] })
const { txid } = await client.sendToAddress({ address: 'mock:recipient', amount: 1000 })
const waiting = waitForTransaction(provider, txid)
provider.mock.setTransactionStatus(txid, 'confirmed')
console.log((await waiting).status)
```

Controls: rejectNext(), setLocked(boolean), setAccount(address), and setTransactionStatus(txid, status). An optional approve(method) callback can asynchronously approve or refuse requests. Reads do not prompt. Permission upgrades and mutations check approval and reject stale contexts. Asset arithmetic uses exact raw-unit strings and checks duplicate allocations before subtracting balances.

The fixture stays in memory, does not inject window.arksat, and does not sign, broadcast, calculate fees, or validate cryptographic addresses. Its addresses, transaction IDs and confirmations are synthetic. It advertises only its implemented methods. Account and network changes clear fixture balances and history; failed transaction statuses do not model refunds or restore balances. It is a UI/testing aid, not a protocol simulator.

## Conformance checks

```ts
import { runConformance } from '@arksat/wallet-sdk/conformance'

const report = await runConformance(provider)
console.table(report.checks)
```

By default it checks capabilities, public connection state and event subscription cleanup. It never calls connect, requests permissions, signs or sends. Each check has a timeout (5000 ms by default). A timeout bounds the diagnostic wait; it cannot cancel an already-running extension RPC.

After the user has granted access, opt into reads:

```ts
const report = await runConformance(provider, {
  readAuthorized: true,
  transactionId: txid,
  timeoutMs: 5000,
})
```

readAuthorized reads balances and assets. transactionId separately queries a known transaction and requires the transactions grant. Missing permissions produce a failed check; the runner does not request them. A passing report checks selected interface behavior; it is not a security audit or payment proof.

## Transaction lookup

```ts
const capabilities = await client.getCapabilities()
if (!capabilities.methods.includes('getTransaction')) throw new Error('Update the extension')
await client.connect({ read: ['transactions'] })
const tx = await client.getTransaction({ txid })
```

The method accepts a txid or wallet record ID, and searches all activity retained in the current wallet snapshot. It does not query a global chain index. null means no matching retained record; it does not prove that a payment never happened. Missing permission or unavailable history throws instead of returning null.

waitForTransaction prefers this lookup. For older providers without the convenience method, it retains the previous latest-100 history fallback. It returns any non-pending status; inspect status before showing success. See [events](events.md) and [method contracts](reference/contracts.md).

Wait timeout and polling options must be finite milliseconds in the range 0–2147483647; invalid values reject with TypeError. waitForTransaction clamps polling to a minimum of 1000 ms. Conformance timeoutMs must be strictly positive.
