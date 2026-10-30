export type AssetAmount = bigint | number | string

export const MAX_ASSET_DECIMALS = 18
export const MAX_ASSET_RAW_AMOUNT = 18446744073709551615n

export function toBigIntAmount(value: AssetAmount | null | undefined): bigint {
  if (typeof value === 'bigint') {
    if (value < 0n) throw new Error('Invalid asset amount')
    return value
  }
  if (typeof value === 'number') {
    if (value < 0 || !Number.isSafeInteger(value)) {
      throw new Error('Invalid asset amount')
    }
    return BigInt(value)
  }

  const raw = String(value ?? '0').trim()
  if (!/^\d+$/.test(raw)) {
    throw new Error('Invalid asset amount')
  }
  return BigInt(raw)
}

export function toSafeNumberAmount(value: AssetAmount | null | undefined): number {
  const amount = toBigIntAmount(value)
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Asset amount exceeds safe JavaScript number range')
  }
  return Number(amount)
}

export function toRawAmountString(value: AssetAmount | null | undefined): string {
  return toBigIntAmount(value).toString()
}

/** Convert user input to exact atomic units; never round or truncate digits. */
export function decimalAmountToRaw(value: string, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_ASSET_DECIMALS) {
    throw new Error('Invalid asset decimals')
  }
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error('Invalid asset amount')
  }
  const [whole = '', fraction = ''] = value.split('.')
  if (fraction.length > decimals) throw new Error('Amount exceeds asset precision')
  const amount = BigInt(`${whole || '0'}${fraction.padEnd(decimals, '0')}`)
  if (amount > MAX_ASSET_RAW_AMOUNT) throw new Error('Asset amount exceeds uint64 range')
  return amount.toString()
}

export function toSignedBigIntAmount(value: AssetAmount | null | undefined): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('Invalid asset amount')
    return BigInt(value)
  }
  const raw = String(value ?? '0').trim()
  if (!/^-?\d+$/.test(raw)) throw new Error('Invalid asset amount')
  return BigInt(raw)
}

export function toSignedRawAmountString(value: AssetAmount | null | undefined): string {
  return toSignedBigIntAmount(value).toString()
}

export function isPositiveAssetAmount(value: AssetAmount | null | undefined): boolean {
  try {
    return toBigIntAmount(value) > 0n
  } catch {
    return false
  }
}

export function formatRawAssetAmount(value: AssetAmount, decimals: unknown): string {
  const raw = toBigIntAmount(value)
  const normalizedDecimals = normalizeDecimals(decimals)
  if (normalizedDecimals === 0) return raw.toString()

  const digits = raw.toString().padStart(normalizedDecimals + 1, '0')
  const whole = digits.slice(0, -normalizedDecimals)
  const fraction = digits.slice(-normalizedDecimals).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

export function normalizeDecimals(value: unknown): number {
  const decimals = Number(value ?? 0)
  if (!Number.isFinite(decimals) || decimals < 0) return 0
  return Math.trunc(decimals)
}

export function toDisplayAmount(rawAmount: AssetAmount, decimals: unknown): number {
  const amount = toSafeNumberAmount(rawAmount)
  const normalizedDecimals = normalizeDecimals(decimals)
  return normalizedDecimals > 0 ? amount / Math.pow(10, normalizedDecimals) : amount
}
