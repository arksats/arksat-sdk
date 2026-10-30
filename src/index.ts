import type { ArksatProvider, ArksatProviderEvent, ArksatProviderEventMap, ArksatTransaction } from './providerContract.js'
import { ArksatProviderError } from './providerErrors.js'
import type { ArksatConnectOptions, ArksatNetwork, ArksatSessionGuard, ArksatSignMessageType, ArksatAssetTransfer, ArksatSwapFundingParams, ArksatSignTransactionParams, ArksatSignTransactionsParams, ArksatIssueAssetParams, ArksatAssetAmountParams, ArksatHistoryOptions } from './providerContract.js'

export * from './providerContract.js'
export { ArksatProviderError, isArksatProviderError } from './providerErrors.js'
export type { ArksatErrorCode, ArksatErrorData } from './providerErrors.js'
export { decimalAmountToRaw, toRawAmountString } from './assetAmounts.js'
export { formatRawAssetAmount } from './amounts.js'

function validDelay(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 2147483647)) {
    throw new TypeError(`${name} must be finite and between 0 and 2147483647 milliseconds`)
  }
}

/** Object-parameter facade. Never retries a mutation or automatically requests permissions. */
export function createArksatClient(provider: ArksatProvider) {
  return {
    connect: async (input?: ArksatConnectOptions) => ({ accounts: await provider.connect(input) }),
    disconnect: () => provider.disconnect(),
    getCapabilities: () => provider.getCapabilities(),
    getProviderState: () => provider.getProviderState(),
    getWalletSession: () => provider.getWalletSession(),
    getNetwork: () => provider.getNetwork(),
    getBalance: () => provider.getBalance(),
    getAssets: () => provider.getAssets(),
    getAssetDetails: (input: { assetId: string }) => provider.getAssetDetails(input),
    getAssetMetadata: (input: { assetId: string }) => provider.getAssetMetadata(input),
    getTransactionHistory: (input?: ArksatHistoryOptions) => provider.getTransactionHistory(input),
    getTransaction: (input: { txid: string }) => provider.getTransaction(input),
    switchNetwork: (input: { network: ArksatNetwork }) => provider.switchNetwork(input.network),
    sendToAddress: async (input: { address: string; amount: number }) => ({ txid: await provider.sendToAddress(input.address, input.amount) }),
    sendAsset: async (input: { address: string; assets: ArksatAssetTransfer[]; bitcoinAmount?: number }) => ({ txid: await provider.sendAsset(input.address, input.assets, input.bitcoinAmount) }),
    sendSwapFunding: async (input: ArksatSwapFundingParams) => ({ txid: await provider.sendSwapFunding(input) }),
    signMessage: async (input: { message: string; type?: ArksatSignMessageType; encoding?: 'utf8' | 'hex' } & ArksatSessionGuard) => ({ signature: await provider.signMessage(input.message, input.type, input.encoding, input) }),
    signTransaction: async (input: ArksatSignTransactionParams & ArksatSessionGuard) => ({ psbtBase64: await provider.signTransaction(input) }),
    signTransactions: async (input: ArksatSignTransactionsParams & ArksatSessionGuard) => ({ transactions: (await provider.signTransactions(input)).map(psbtBase64 => ({ psbtBase64 })) }),
    issueAsset: (input: ArksatIssueAssetParams) => provider.issueAsset(input),
    reissueAsset: (input: ArksatAssetAmountParams) => provider.reissueAsset(input),
    burnAsset: (input: ArksatAssetAmountParams) => provider.burnAsset(input),
  }
}

export type ArksatClient = ReturnType<typeof createArksatClient>

/** Safe to import during SSR. Does not request connection or unlock. */
export function getArksatProvider(): ArksatProvider | undefined {
  return typeof window === 'undefined' ? undefined : (window as Window & { arksat?: ArksatProvider }).arksat
}

export function waitForArksatProvider(options: { timeoutMs?: number; signal?: AbortSignal } = {}): Promise<ArksatProvider> {
  return new Promise((resolve, reject) => {
    validDelay(options.timeoutMs, 'timeoutMs')
    if (typeof window === 'undefined') { reject(new Error('Arksat requires a browser')); return }
    // eslint-disable-next-line prefer-const -- Abort can run cleanup before a timeout has been scheduled.
    let timer: ReturnType<typeof setTimeout> | undefined
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('arksat#initialized', check); options.signal?.removeEventListener('abort', abort) }
    const abort = () => { cleanup(); reject(options.signal?.reason ?? new Error('Aborted')) }
    const check = () => { const provider = getArksatProvider(); if (provider) { cleanup(); resolve(provider) } }
    if (options.signal?.aborted) { abort(); return }
    window.addEventListener('arksat#initialized', check)
    options.signal?.addEventListener('abort', abort, { once: true })
    timer = setTimeout(() => { cleanup(); reject(new ArksatProviderError({ code: 'TIMEOUT', message: 'Wallet provider not found', retryable: false })) }, options.timeoutMs ?? 5000)
    check()
  })
}

/** Returns an idempotent disposer for framework effects and route changes. */
export function subscribe<E extends ArksatProviderEvent>(provider: ArksatProvider, event: E, listener: (data: ArksatProviderEventMap[E]) => void): () => void {
  provider.on(event, listener)
  let active = true
  return () => { if (active) { active = false; provider.off(event, listener) } }
}

/** Reads authorized wallet history; never connects, prompts, signs or retries payments.
 * Uses direct lookup when available; old extensions search only the latest 100 records.
 * Returns any non-pending status, not just success. This is not merchant payment proof. */
export function waitForTransaction(provider: ArksatProvider, txid: string, options: { timeoutMs?: number; pollIntervalMs?: number; signal?: AbortSignal } = {}): Promise<ArksatTransaction> {
  return new Promise((resolve, reject) => {
    validDelay(options.timeoutMs, 'timeoutMs')
    validDelay(options.pollIntervalMs, 'pollIntervalMs')
    const stops: Array<() => void> = []
    let done = false, reading = false, queued = false
    let poll: ReturnType<typeof setTimeout> | undefined
    // eslint-disable-next-line prefer-const -- An already-aborted signal calls finish before scheduling the timeout.
    let timeout: ReturnType<typeof setTimeout> | undefined
    const finish = (error?: unknown, tx?: ArksatTransaction) => {
      if (done) return
      done = true; clearTimeout(poll); clearTimeout(timeout)
      for (const stop of stops) stop()
      options.signal?.removeEventListener('abort', abort)
      if (tx) resolve(tx); else reject(error)
    }
    const abort = () => finish(options.signal?.reason ?? new Error('Aborted'))
    const changed = () => finish(new ArksatProviderError({ code: 'CONTEXT_CHANGED', message: 'Wallet context changed', retryable: false }))
    const read = async () => {
      if (done) return
      if (reading) { queued = true; return }
      clearTimeout(poll); reading = true
      try {
        const tx = typeof provider.getTransaction === 'function'
          ? await provider.getTransaction({ txid })
          : (await provider.getTransactionHistory({ limit: 100 })).find(tx => tx.txid === txid || tx.id === txid)
        if (tx && tx.status !== 'pending') finish(undefined, tx)
      } catch (error) { finish(error) }
      finally {
        reading = false
        if (!done) {
          const delay = queued ? 0 : Math.max(1000, options.pollIntervalMs ?? 3000)
          queued = false; poll = setTimeout(() => { void read() }, delay)
        }
      }
    }
    if (typeof txid !== 'string' || !txid || txid.trim() !== txid || txid.length > 256) { finish(new TypeError('Valid transaction ID required')); return }
    if (options.signal?.aborted) { abort(); return }
    try {
      stops.push(subscribe(provider, 'transaction:updated', () => { void read() }))
      for (const event of ['account:changed', 'network:changed', 'wallet:locked', 'connection:disconnected'] as const) stops.push(subscribe(provider, event, changed))
    } catch (error) { finish(error); return }
    options.signal?.addEventListener('abort', abort, { once: true })
    timeout = setTimeout(() => finish(new ArksatProviderError({ code: 'TIMEOUT', message: 'Transaction status wait timed out; query history before retrying payment', retryable: false })), options.timeoutMs ?? 120000)
    void read()
  })
}
