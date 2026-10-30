import { formatRawAssetAmount as format, MAX_ASSET_DECIMALS, type AssetAmount } from './assetAmounts.js'

/** Public SDK formatting requires known precision; never silently guesses or truncates it. */
export function formatRawAssetAmount(value: AssetAmount, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_ASSET_DECIMALS) {
    throw new TypeError('Asset decimals must be an integer from 0 to 18')
  }
  return format(value, decimals)
}
