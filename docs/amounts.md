# Amounts and precision

| Data | Type and unit |
| --- | --- |
| BTC balances, transfer amounts, history amount | number, integer sats |
| Token amounts and supply | string, integer atomic units |
| User decimal input | string |
| Exact display | displayAmountText or formatRawAssetAmount |

```ts
import { decimalAmountToRaw, formatRawAssetAmount } from '@arksat/wallet-sdk'

const raw = decimalAmountToRaw('1.25', 8) // '125000000'
const text = formatRawAssetAmount('1000000000000000001', 18)
// '1.000000000000000001'
```

## Conversion rules
`decimalAmountToRaw(value, decimals)` accepts 0–18 decimals. It rejects excess fractional digits and values above uint64 without rounding or truncating.

Maximum raw amount: `18446744073709551615`. Conversion accepts zero; transfer, issue, reissue, and burn amounts must be positive.

`toRawAmountString` normalizes a raw integer. It does not convert decimal input.

Do not convert user input to Number or multiply floating-point amounts by powers of ten. Do not derive transaction amounts from approximate displayAmount.

## Unknown metadata
When metadataPending is true or decimals are unknown, display labelled atomic units until trusted metadata is available. Keep large integers as strings in JSON.

formatRawAssetAmount(raw, decimals) requires an integer number from 0 to 18; unknown, string, negative or fractional precision throws instead of silently defaulting or truncating. toRawAmountString normalizes nonnegative integers without enforcing uint64 bounds; transaction submission validates the uint64 range separately.
