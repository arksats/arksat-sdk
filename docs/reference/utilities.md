# SDK utilities and Provider

## getArksatProvider
`getArksatProvider(): ArksatProvider | undefined` detects the extension immediately. Returns undefined during SSR; does not connect or unlock.

## waitForArksatProvider
`waitForArksatProvider({ timeoutMs?, signal? }): Promise<ArksatProvider>` waits for injection. Default timeout: 5000 ms.

## createArksatClient
```ts
import { waitForArksatProvider, createArksatClient } from '@arksat/wallet-sdk'
const provider = await waitForArksatProvider()
const client = createArksatClient(provider)
```
Wraps Provider methods with object parameters and named results. It does not automatically request permissions or retry mutations.

| Operation | Client | Provider |
| --- | --- | --- |
| Connect | accounts object | Address array |
| Send BTC | Object parameters; txid object | Positional parameters; txid string |
| Send tokens | Object parameters; txid object | Positional parameters; txid string |
| Sign | Named fields | String or string array |

## request
RPC params are tuples matching raw Provider arguments:
```ts
const network = await provider.request({ method: 'getNetwork' })
const txid = await provider.request({
  method: 'sendToAddress',
  params: [address, 1000],
})
```
Supported RPC methods are listed by ARKSAT_PROVIDER_METHODS and getCapabilities. requestAccounts is a convenience alias.

## Amount utilities
decimalAmountToRaw, formatRawAssetAmount, and toRawAmountString handle exact conversion. [Amounts](https://docs.arksat.xyz/en/amounts).

## Scope
The SDK uses the browser extension, not a remote Web wallet HTTP API. Private-key export, internal wallet administration, and settlement are not public RPC methods.
