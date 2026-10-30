import { ARKSAT_CAPABILITIES, type ArksatProvider, type DappMethod, type ArksatNetwork, type ArksatProviderEvent, type ArksatProviderEventMap, type ArksatTransaction, type ArksatAssetBalance } from './providerContract.js'
import { ArksatProviderError, type ArksatErrorCode } from './providerErrors.js'

export interface MockOptions {
  address?: string
  network?: ArksatNetwork
  balance?: number
  assets?: ArksatAssetBalance[]
  transactions?: ArksatTransaction[]
  /** Called only for operations that would ask for approval. No real funds move. */
  approve?: (method: DappMethod) => boolean | Promise<boolean>
}

const methods: DappMethod[] = ['connect', 'disconnect', 'isConnected', 'getAccounts', 'getAddress',
  'getNetwork', 'getProviderState', 'getCapabilities', 'getBalance', 'getAssets', 'getAssetDetails',
  'getTransactionHistory', 'getTransaction', 'sendToAddress', 'sendAsset', 'switchNetwork']

/** In-memory development fixture. Does not inject globals or implement cryptographic signing. */
export function createMockProvider(options: MockOptions = {}) {
  let address = options.address ?? 'mock:arksat:account-1'
  let network = options.network ?? 'mutinynet'
  let balance = options.balance ?? 100_000
  let connected = false, locked = false, historyGranted = false, revision = 0, counter = 0, rejectNext = false
  const assets = structuredClone(options.assets ?? [])
  const transactions = structuredClone(options.transactions ?? [])
  const listeners = new Map<ArksatProviderEvent, Set<(data: unknown) => void>>()
  const fail = (code: ArksatErrorCode, message: string): never => { throw new ArksatProviderError({ code, message, retryable: false }) }
  const unsupported = (): never => fail('UNSUPPORTED_METHOD', 'This operation is not implemented by the mock wallet')
  const emit = <E extends ArksatProviderEvent>(event: E, data: ArksatProviderEventMap[E]) => {
    if (['transaction:updated', 'balance:changed', 'assets:changed'].includes(event) && (!connected || locked)) return
    for (const listener of [...(listeners.get(event) ?? [])]) listener(structuredClone(data))
  }
  const requireConnection = () => {
    if (locked) fail('WALLET_LOCKED', 'Mock wallet is locked')
    if (!connected) fail('UNAUTHORIZED', 'Connect the mock wallet first')
  }
  const requireHistory = () => { requireConnection(); if (!historyGranted) fail('UNAUTHORIZED', 'Transaction history permission required') }
  const approve = async (method: DappMethod) => {
    const before = revision
    const rejected = rejectNext
    rejectNext = false
    if (rejected || (options.approve && !await options.approve(method))) fail('USER_REJECTED', 'User rejected the request')
    if (before !== revision) fail('CONTEXT_CHANGED', 'Mock wallet context changed during approval')
    if (locked) fail('WALLET_LOCKED', 'Mock wallet is locked')
  }
  const info = () => ({ network, displayName: `Mock ${network}`, isTestnet: network !== 'mainnet', arkServerUrl: 'https://mock.invalid', delegateUrl: null })
  const validSats = (amount: number) => { if (!Number.isSafeInteger(amount) || amount <= 0) fail('INVALID_PARAMS', 'Amount must be positive integer sats') }
  const record = (destination: string, amount: number, sentAssets?: ArksatTransaction['assets']) => {
    let id: string
    do { id = `mock-tx-${++counter}` } while (transactions.some(tx => tx.id === id || tx.txid === id))
    const tx: ArksatTransaction = { id, txid: id, type: 'send', status: 'pending', amount,
      token: sentAssets?.length ? 'ASSET' : 'BTC', address: destination, timestamp: Date.now(), rail: 'ark', network,
      ...(sentAssets ? { assets: structuredClone(sentAssets) } : {}) }
    transactions.unshift(tx)
    emit('transaction:updated', { ...tx, updatedAt: tx.timestamp })
    emit('balance:changed', { updatedAt: Date.now(), amountsChanged: true })
    return id
  }
  const provider: ArksatProvider = {
    eventsVersion: 2,
    async request(args) {
      if (!methods.includes(args.method)) return unsupported()
      const invoke = provider[args.method] as (...params: unknown[]) => Promise<unknown>
      return await invoke(...(args.params ?? [])) as never
    },
    async connect(input) {
      if (input?.actions?.length) return unsupported()
      if (!connected || locked || (input?.read?.includes('transactions') && !historyGranted)) await approve('connect')
      connected = true
      if (input?.read?.includes('transactions')) historyGranted = true
      emit('connection:connected', {})
      return [address]
    },
    async requestAccounts() { return provider.connect() },
    async disconnect() {
      connected = false; historyGranted = false; revision++
      emit('connection:disconnected', { message: 'Mock wallet disconnected' })
    },
    async isConnected() { return connected },
    async getAccounts() { return connected && !locked ? [address] : [] },
    async getAddress() { requireConnection(); return address },
    async getPublicKey() { return unsupported() },
    async getNetwork() { if (!connected) fail('UNAUTHORIZED', 'Connect the mock wallet first'); return info() },
    async getProviderState() { return { accounts: connected && !locked ? [address] : [], network: connected ? network : null, isConnected: connected, isUnlocked: connected && !locked } },
    async getWalletSession() { return unsupported() },
    async getCapabilities() { return structuredClone({ ...ARKSAT_CAPABILITIES, methods }) },
    async getBalance() {
      requireConnection()
      return { available: balance, total: balance, assets: structuredClone(assets),
        vtxo: { confirmed: balance, unconfirmed: 0, total: balance }, boarding: { confirmed: 0, unconfirmed: 0, total: 0 } }
    },
    async getAssets() { requireConnection(); return structuredClone(assets) },
    async getAssetDetails(input) { requireConnection(); return structuredClone(assets.find(asset => asset.assetId === input.assetId) ?? null) },
    async getAssetMetadata() { return unsupported() },
    async getTransactionHistory(input = {}) {
      requireHistory()
      const { limit = 50, offset = 0 } = input
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) fail('INVALID_PARAMS', 'Invalid history pagination')
      return structuredClone(transactions.filter(tx => tx.network === network).sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id)).slice(offset, offset + limit))
    },
    async getTransaction(input) {
      requireHistory()
      if (!input?.txid || typeof input.txid !== 'string') fail('INVALID_PARAMS', 'Transaction ID required')
      return structuredClone(transactions.find(tx => tx.network === network && (tx.txid === input.txid || tx.id === input.txid)) ?? null)
    },
    async sendToAddress(destination, amount) {
      requireConnection(); validSats(amount)
      if (!destination?.trim()) fail('INVALID_PARAMS', 'Address required')
      await approve('sendToAddress'); requireConnection()
      if (amount > balance) fail('INSUFFICIENT_FUNDS', 'Insufficient mock BTC balance')
      balance -= amount
      return record(destination, amount)
    },
    async sendAsset(destination, transfers, bitcoinAmount = 0) {
      requireConnection()
      if (!destination?.trim() || !transfers.length || !Number.isSafeInteger(bitcoinAmount) || bitcoinAmount < 0) fail('INVALID_PARAMS', 'Invalid mock transfer')
      const totals = new Map<string, bigint>()
      for (const asset of transfers) {
        if (!/^[0-9a-f]{68}$/i.test(asset.assetId) || !/^[0-9]+$/.test(asset.amount) || BigInt(asset.amount) <= 0n || BigInt(asset.amount) > 18446744073709551615n) fail('INVALID_PARAMS', 'Invalid raw asset amount or asset ID')
        totals.set(asset.assetId, (totals.get(asset.assetId) ?? 0n) + BigInt(asset.amount))
      }
      await approve('sendAsset'); requireConnection()
      if (bitcoinAmount > balance) fail('INSUFFICIENT_FUNDS', 'Insufficient mock BTC balance')
      for (const [id, amount] of totals) {
        const held = assets.find(asset => asset.assetId === id)
        if (!held || BigInt(held.amount) < amount) fail('INSUFFICIENT_FUNDS', 'Insufficient mock asset balance')
      }
      for (const [id, amount] of totals) {
        const held = assets.find(asset => asset.assetId === id)!
        held.rawAmount = held.amount = (BigInt(held.amount) - amount).toString()
        held.displayAmountText = held.amount
        held.displayAmount = Number(held.amount)
        held.metadataPending = true
      }
      balance -= bitcoinAmount
      emit('assets:changed', { amountsChanged: true, updatedAt: Date.now() })
      return record(destination, bitcoinAmount, transfers)
    },
    async switchNetwork(target) {
      requireConnection()
      if (!['mainnet', 'mutinynet'].includes(target)) fail('INVALID_PARAMS', 'Unsupported network')
      if (target === network) return
      await approve('switchNetwork'); requireConnection()
      network = target; revision++; connected = false; historyGranted = false
      transactions.length = 0; assets.length = 0; balance = 0
      emit('network:changed', network)
      emit('connection:disconnected', { message: 'Reconnect on the selected mock network' })
    },
    async sendSwapFunding() { return unsupported() },
    async issueAsset() { return unsupported() },
    async reissueAsset() { return unsupported() },
    async burnAsset() { return unsupported() },
    async signMessage() { return unsupported() },
    async signTransaction() { return unsupported() },
    async signTransactions() { return unsupported() },
    on(event, listener) {
      if (!ARKSAT_CAPABILITIES.events.includes(event)) fail('INVALID_PARAMS', 'Unknown event')
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)!.add(listener as (data: unknown) => void)
    },
    off(event, listener) { listeners.get(event)?.delete(listener as (data: unknown) => void) },
  }
  return Object.assign(provider, {
    mock: {
      rejectNext() { rejectNext = true },
      setLocked(value: boolean) { locked = value; revision++; emit(value ? 'wallet:locked' : 'wallet:unlocked', null) },
      setAccount(value: string) {
        address = value; revision++; connected = false; historyGranted = false
        // Fixture data belongs to the previous account.
        transactions.length = 0; assets.length = 0; balance = 0
        emit('account:changed', [])
        emit('connection:disconnected', { message: 'Mock account changed' })
      },
      setTransactionStatus(txid: string, status: ArksatTransaction['status']) {
        const tx = transactions.find(tx => tx.network === network && (tx.id === txid || tx.txid === txid))
        if (!tx) throw new Error('Mock transaction not found')
        tx.status = status
        emit('transaction:updated', { ...tx, updatedAt: Date.now() })
      },
      listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0) },
    },
  })
}
