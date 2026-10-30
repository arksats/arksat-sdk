# Send transactions

Connect first. Call transfers from a user action and handle errors.

## BTC
```ts
import type { ArksatClient } from '@arksat/wallet-sdk'

export async function sendBtc(client: ArksatClient, address: string) {
  return client.sendToAddress({ address, amount: 1000 })
}
```
Amount is a positive integer in sats. The result is `{ txid }`.

## Tokens
```ts
import { decimalAmountToRaw, type ArksatClient } from '@arksat/wallet-sdk'

export async function sendToken(
  client: ArksatClient,
  address: string,
  assetId: string,
  amountText: string,
  decimals: number,
) {
  const amount = decimalAmountToRaw(amountText, decimals)
  return client.sendAsset({ address, assets: [{ assetId, amount }] })
}
```
Use decimals from verified asset metadata. assetId is a 68-character hexadecimal string; amount is a positive uint64 atomic-unit string.

Optional `bitcoinAmount` is BTC sent with the transaction, in sats. It is not the fee parameter.

## Submission
A transaction ID indicates submission, not final settlement. On timeout or disconnect, check [activity](https://docs.arksat.xyz/en/events) before retrying.

`sendSwapFunding` submits protocol funding and does not complete an entire swap. [API reference](https://docs.arksat.xyz/en/reference/transfers).
