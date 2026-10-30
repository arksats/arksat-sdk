import type { ArksatProvider, ArksatCapabilities } from './providerContract.js'

export interface ConformanceCheck { name: string; status: 'pass' | 'fail' | 'skip'; detail?: string }
export interface ConformanceOptions {
  timeoutMs?: number
  /** Read already-authorized balances and assets. Never calls connect or requests permissions. */
  readAuthorized?: boolean
  /** Optional lookup of a known transaction; requires an existing history grant. */
  transactionId?: string
}

/** Diagnostic checks, not a security audit or a payment proof. Never calls a mutation. */
export async function runConformance(provider: ArksatProvider, options: ConformanceOptions = {}) {
  const checks: ConformanceCheck[] = []
  const timeoutMs = options.timeoutMs ?? 5000
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2147483647) throw new TypeError('timeoutMs must be positive and at most 2147483647')
  const assert: (value: unknown, message: string) => asserts value = (value, message) => { if (!value) throw new Error(message) }
  const check = async (name: string, body: () => Promise<void> | void) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([Promise.resolve().then(body), new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Diagnostic read timed out')), timeoutMs)
      })])
      checks.push({ name, status: 'pass' })
    } catch (error) { checks.push({ name, status: 'fail', detail: error instanceof Error ? error.message : String(error) }) }
    finally { clearTimeout(timer) }
  }
  let capabilities: ArksatCapabilities | undefined
  await check('capabilities', async () => {
    capabilities = await provider.getCapabilities()
    assert(capabilities.apiVersion === 2 && capabilities.eventsVersion === 2, 'Expected Provider API 2 and events 2')
    assert(Array.isArray(capabilities.methods) && capabilities.methods.every(method => typeof method === 'string'), 'Invalid method list')
    assert(new Set(capabilities.methods).size === capabilities.methods.length, 'Duplicate advertised methods')
    for (const method of ['connect', 'disconnect', 'getCapabilities', 'getProviderState'] as const) assert(capabilities.methods.includes(method), `Missing base method: ${method}`)
    assert(Array.isArray(capabilities.events) && capabilities.events.includes('transaction:updated'), 'Invalid event capabilities')
    assert(Array.isArray(capabilities.networks) && capabilities.networks.length > 0 && capabilities.networks.every(network => network === 'mainnet' || network === 'mutinynet'), 'Invalid network capabilities')
    for (const method of capabilities.methods) assert(typeof (provider as unknown as Record<string, unknown>)[method] === 'function', `Advertised method is missing: ${method}`)
  })
  await check('public-state', async () => {
    const state = await provider.getProviderState()
    assert(Array.isArray(state.accounts) && state.accounts.every(account => typeof account === 'string'), 'Invalid account list')
    assert(typeof state.isConnected === 'boolean' && typeof state.isUnlocked === 'boolean', 'Invalid connection state')
    assert(state.network === null || state.network === 'mainnet' || state.network === 'mutinynet', 'Invalid network')
    if (!state.isConnected) assert(state.accounts.length === 0 && !state.isUnlocked && state.network === null, 'Unconnected state discloses wallet context')
    if (!state.isUnlocked) assert(state.accounts.length === 0, 'Locked state discloses accounts')
  })
  await check('event-subscription', () => {
    const listener = () => {}
    try { provider.on('transaction:updated', listener) }
    finally { provider.off('transaction:updated', listener) }
  })
  if (options.readAuthorized) {
    await check('balance', async () => {
      const balance = await provider.getBalance()
      assert(Number.isSafeInteger(balance.available) && balance.available >= 0, 'Invalid available sats')
      assert(Number.isSafeInteger(balance.total) && balance.total >= 0, 'Invalid total sats')
    })
    await check('asset-amounts', async () => {
      const assets = await provider.getAssets()
      assert(Array.isArray(assets), 'Assets must be an array')
      for (const asset of assets) {
        assert(typeof asset.amount === 'string' && /^[0-9]+$/.test(asset.amount), 'Asset amount must be an integer string')
        assert(BigInt(asset.amount) <= 18446744073709551615n, 'Asset amount exceeds uint64')
      }
    })
  } else checks.push({ name: 'authorized-reads', status: 'skip', detail: 'Opt in after the user has connected the wallet' })
  if (options.transactionId) {
    await check('transaction-lookup', async () => {
      assert(capabilities?.methods.includes('getTransaction'), 'Wallet does not advertise getTransaction')
      const tx = await provider.getTransaction({ txid: options.transactionId! })
      assert(tx === null || (tx.txid === options.transactionId || tx.id === options.transactionId), 'Lookup returned a different transaction')
      if (tx) assert(['pending', 'confirmed', 'failed', 'cancelled', 'recoverable'].includes(tx.status), 'Unknown transaction status')
    })
  }
  return { ok: checks.every(check => check.status !== 'fail'), checks }
}
