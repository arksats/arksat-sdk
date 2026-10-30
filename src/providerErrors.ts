export type ArksatErrorCode =
  | 'USER_REJECTED' | 'UNAUTHORIZED' | 'WALLET_LOCKED' | 'CONTEXT_CHANGED'
  | 'UNSUPPORTED_METHOD' | 'INVALID_PARAMS' | 'INSUFFICIENT_FUNDS'
  | 'QUOTE_EXPIRED' | 'RATE_LIMITED' | 'TIMEOUT' | 'NETWORK_ERROR'
  | 'EXTENSION_DISCONNECTED' | 'INTERNAL_ERROR'

export interface ArksatErrorData {
  code: ArksatErrorCode
  message: string
  /** Read requests only. Never automatically retry a payment or signature. */
  retryable: boolean
  retryAfter?: number
}

const errorCodes: readonly ArksatErrorCode[] = ['USER_REJECTED', 'UNAUTHORIZED', 'WALLET_LOCKED', 'CONTEXT_CHANGED',
  'UNSUPPORTED_METHOD', 'INVALID_PARAMS', 'INSUFFICIENT_FUNDS', 'QUOTE_EXPIRED', 'RATE_LIMITED', 'TIMEOUT',
  'NETWORK_ERROR', 'EXTENSION_DISCONNECTED', 'INTERNAL_ERROR']

/** Works across bundles, realms and structured-clone boundaries. */
export function isArksatProviderError(value: unknown): value is ArksatErrorData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<ArksatErrorData>
  return typeof data.code === 'string' && errorCodes.includes(data.code as ArksatErrorCode) &&
    typeof data.message === 'string' && typeof data.retryable === 'boolean'
}

export class ArksatProviderError extends Error {
  readonly code: ArksatErrorCode
  readonly retryable: boolean
  readonly retryAfter?: number
  constructor(data: ArksatErrorData) {
    super(data.message)
    this.name = 'ArksatProviderError'
    this.code = data.code
    this.retryable = data.retryable
    this.retryAfter = data.retryAfter
  }
}

const readMethods = new Set(['getCapabilities', 'getProviderState', 'isConnected', 'getAccounts',
  'getAddress', 'getPublicKey', 'getNetwork', 'getWalletSession', 'getBalance',
  'getAssets', 'getAssetDetails', 'getAssetMetadata', 'getTransactionHistory', 'getTransaction'])

/** Maps legacy internal failures once at the public boundary; never exports SDK objects. */
export function serializeProviderError(error: unknown, method?: string): ArksatErrorData {
  const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message : String(error)
  let code: ArksatErrorCode = 'INTERNAL_ERROR'
  if (isArksatProviderError(error)) code = error.code
  else if (/user rejected/i.test(message)) code = 'USER_REJECTED'
  else if (/unsupported method/i.test(message)) code = 'UNSUPPORTED_METHOD'
  else if (/extension.*(?:updated|disconnected|invalidated)|reload this page/i.test(message)) code = 'EXTENSION_DISCONNECTED'
  else if (/wallet is locked/i.test(message)) code = 'WALLET_LOCKED'
  else if (/context changed|account changed|session changed|wallet mismatch|network mismatch/i.test(message)) code = 'CONTEXT_CHANGED'
  else if (/not connected|permission|unauthorized|origin mismatch|verify dapp origin/i.test(message)) code = 'UNAUTHORIZED'
  else if (/quote.*expir/i.test(message)) code = 'QUOTE_EXPIRED'
  else if (/insufficient/i.test(message)) code = 'INSUFFICIENT_FUNDS'
  else if (/429|rate.limit/i.test(message)) code = 'RATE_LIMITED'
  else if (/timeout|timed out/i.test(message)) code = 'TIMEOUT'
  else if (/network|failed to fetch|fetch failed|gateway/i.test(message)) code = 'NETWORK_ERROR'
  const retryAfter = (error as { retryAfter?: unknown } | null)?.retryAfter
  return {
    code, message,
    retryable: readMethods.has(method ?? '') && ['RATE_LIMITED', 'TIMEOUT', 'NETWORK_ERROR'].includes(code),
    ...(typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter >= 0 ? { retryAfter } : {}),
  }
}
