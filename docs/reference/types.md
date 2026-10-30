# TypeScript types

SDK 0.1.0 · Provider API 2 · events 2.

<!-- Derived from src/providerContract.ts. -->

```ts
export type ArksatNetwork = 'mainnet' | 'mutinynet'

export interface ArksatNetworkInfo {
  network: ArksatNetwork
  displayName: string
  isTestnet: boolean
  arkServerUrl: string
  /** Actual receive-script delegate endpoint while unlocked, or null without a delegate path. */
  delegateUrl: string | null
}

export interface ArksatProviderState {
  accounts: string[]
  network: ArksatNetwork | null
  isConnected: boolean
  isUnlocked: boolean
}

export interface ArksatRelativeTimelock {
  type: 'blocks' | 'seconds'
  value: string
}

/** One coherent snapshot of the active SDK wallet. Contains public data only. */
export interface ArksatWalletSession {
  version: 1
  /** Opaque runtime token; invalid after lock, account, network or script changes. */
  sessionId: string
  address: string
  boardingAddress: string
  publicKey: string
  network: ArksatNetworkInfo
  sdk: {
    walletMode: 'static'
    serverPublicKey: string
    exitTimelock: ArksatRelativeTimelock
    boardingTimelock: ArksatRelativeTimelock
    /** Actual receive-script delegate key, not merely the saved preference. */
    delegatePublicKey: string | null
  }
}

export interface ArksatSessionGuard {
  expectedAddress?: string
  expectedNetwork?: ArksatNetwork
  expectedSessionId?: string
}

export interface ArksatBalance {
  available: number
  total: number
  assets?: ArksatAssetBalance[]
  availableAssets?: ArksatAssetTransfer[]
  gated?: number
  intentLocked?: number
  recoverable?: number
  pendingRecovery?: number
  vtxo: {
    confirmed: number
    unconfirmed: number
    total: number
  }
  boarding: {
    confirmed: number
    unconfirmed: number
    total: number
  }
}

export interface ArksatAssetTransfer {
  assetId: string
  amount: string
}

export interface ArksatAssetBalance extends ArksatAssetTransfer {
  rawAmount: string
  /** True when decimals/name are not yet authoritative. Display raw units explicitly. */
  metadataPending?: boolean
  /** Approximate numeric display for existing integrations; never use for signing. */
  displayAmount: number
  /** Exact decimal text, including digits beyond the number precision limit. */
  displayAmountText?: string
  metadata?: ArksatIssueAssetMetadata & {
    icon?: string
  }
  name?: string
  ticker?: string
  decimals?: number
  icon?: string
}

export interface ArksatIssueAssetMetadata {
  name: string
  ticker: string
  decimals: number
}

export type ArksatAssetAction = 'issueAsset' | 'reissueAsset' | 'burnAsset'
export interface ArksatConnectOptions {
  read?: Array<'transactions'>
  /** Explicit opt-in; every asset operation still requires approval. */
  actions?: ArksatAssetAction[]
}
export interface ArksatIssueAssetParams extends ArksatSessionGuard {
  amount: string
  metadata: ArksatIssueAssetMetadata
  /** Existing control asset required for future reissuance; omit for fixed supply. */
  controlAssetId?: string
}
export interface ArksatAssetAmountParams extends ArksatSessionGuard { assetId: string; amount: string }
export interface ArksatIssueAssetResult { assetId: string; arkTxId: string }
export interface ArksatAssetDetails {
  assetId: string
  supply: string
  metadata?: Partial<ArksatIssueAssetMetadata> & { icon?: string }
  controlAssetId?: string
}

export type ArksatSignMessageType = 'ecdsa' | 'schnorr'

export interface ArksatSignTransactionParams {
  psbtBase64: string
  inputIndexes?: number[]
}

export interface ArksatSignTransactionsParams {
  transactions: ArksatSignTransactionParams[]
}

export const ARKSAT_PROVIDER_METHODS = [
  'connect',
  'disconnect',
  'isConnected',
  'getAccounts',
  'getAddress',
  'getPublicKey',
  'getNetwork',
  'getProviderState',
  'getCapabilities',
  'getWalletSession',
  'getBalance',
  'sendToAddress',
  'getAssets',
  'getAssetDetails',
  'getAssetMetadata',
  'issueAsset',
  'reissueAsset',
  'burnAsset',
  'getTransactionHistory',
  'getTransaction',
  'sendAsset',
  'sendSwapFunding',
  'signMessage',
  'signTransaction',
  'signTransactions',
  'switchNetwork',
] as const

export type DappMethod = typeof ARKSAT_PROVIDER_METHODS[number]

export const ARKSAT_SAFE_METHODS: readonly DappMethod[] = [
  'getCapabilities',
  'getNetwork',
  'isConnected',
  'getProviderState',
]

export type ArksatProviderEvent =
  | 'account:changed'
  | 'network:changed'
  | 'balance:changed'
  | 'assets:changed'
  | 'transaction:updated'
  | 'transfer:received'
  | 'transfer:settled'
  | 'connection:connected'
  | 'connection:disconnected'
  | 'wallet:unlocked'
  | 'wallet:locked'

export const ARKSAT_PROVIDER_EVENTS: ArksatProviderEvent[] = [
  'account:changed',
  'network:changed',
  'balance:changed',
  'assets:changed',
  'transaction:updated',
  'transfer:received',
  'transfer:settled',
  'connection:connected',
  'connection:disconnected',
  'wallet:unlocked',
  'wallet:locked',
]

export interface ArksatDataEvent {
  reason?: string | null
  updatedAt?: number | null
  amountsChanged?: boolean
  balancePending?: boolean
}

/** A history notification, not a payment receipt or proof of finality. */
export interface ArksatTransactionEvent {
  id: string
  txid: string
  type: 'send' | 'receive' | 'swap' | 'issue' | 'burn' | 'reissue'
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'recoverable'
  rail: 'ark' | 'onchain' | 'lightning'
  network: ArksatNetwork
  updatedAt: number | null
}

export interface ArksatProviderEventMap {
  'account:changed': string[]
  'network:changed': ArksatNetwork
  'balance:changed': ArksatDataEvent | null
  'assets:changed': ArksatDataEvent | null
  'transaction:updated': ArksatTransactionEvent
  'transfer:received': ArksatTransactionEvent
  'transfer:settled': ArksatTransactionEvent
  'connection:connected': Record<string, never>
  'connection:disconnected': { message: string }
  'wallet:locked': null
  'wallet:unlocked': null
}

export interface ArksatSwapFundingParams {
  /** Optional diagnostics correlation ID; never used for authorization. */
  timingId?: string
  address: string
  assets: ArksatAssetTransfer[]
  bitcoinAmount: number
  extension: { type: number; payload: string }
  expectedAddress?: string
  expectedNetwork?: ArksatNetwork
  expectedSessionId?: string
}

export interface ArksatProvider {
  readonly eventsVersion: 2
  request<M extends DappMethod>(args: { method: M } & ([] extends ArksatRpcMap[M]['params']
    ? { params?: ArksatRpcMap[M]['params'] }
    : { params: ArksatRpcMap[M]['params'] })): Promise<ArksatRpcMap[M]['result']>
  connect(options?: ArksatConnectOptions): Promise<string[]>
  requestAccounts(): Promise<string[]>
  disconnect(): Promise<void>
  isConnected(): Promise<boolean>
  getAccounts(): Promise<string[]>
  getAddress(): Promise<string>
  getPublicKey(): Promise<string>
  getNetwork(): Promise<ArksatNetworkInfo>
  getProviderState(): Promise<ArksatProviderState>
  getWalletSession(): Promise<ArksatWalletSession>
  getBalance(): Promise<ArksatBalance>
  getAssets(): Promise<ArksatAssetBalance[]>
  /** Searches the current wallet's held assets; null is not proof of global nonexistence. */
  getAssetDetails(input: { assetId: string }): Promise<ArksatAssetBalance | null>
  getAssetMetadata(input: { assetId: string }): Promise<ArksatAssetDetails>
  issueAsset(input: ArksatIssueAssetParams): Promise<ArksatIssueAssetResult>
  reissueAsset(input: ArksatAssetAmountParams): Promise<{ txid: string }>
  burnAsset(input: ArksatAssetAmountParams): Promise<{ txid: string }>
  getTransactionHistory(options?: ArksatHistoryOptions): Promise<ArksatTransaction[]>
  /** Looks through all activity retained by this wallet; null is not chain proof. */
  getTransaction(input: { txid: string }): Promise<ArksatTransaction | null>
  getCapabilities(): Promise<ArksatCapabilities>
  sendToAddress(address: string, amount: number): Promise<string>
  sendAsset(address: string, assets: ArksatAssetTransfer[], bitcoinAmount?: number): Promise<string>
  sendSwapFunding(input: ArksatSwapFundingParams): Promise<string>
  signTransaction(input: ArksatSignTransactionParams & ArksatSessionGuard): Promise<string>
  signTransactions(input: ArksatSignTransactionsParams & ArksatSessionGuard): Promise<string[]>
  signMessage(message: string, type?: ArksatSignMessageType, encoding?: 'utf8' | 'hex', expected?: ArksatSessionGuard): Promise<string>
  switchNetwork(network: ArksatNetwork): Promise<void>
  on<E extends ArksatProviderEvent>(event: E, handler: (data: ArksatProviderEventMap[E]) => void): void
  off<E extends ArksatProviderEvent>(event: E, handler: (data: ArksatProviderEventMap[E]) => void): void
}

/** Bounded newest-first history. Offset pagination is not a stable snapshot. */
export interface ArksatHistoryOptions {
  limit?: number
  offset?: number
}

/** Public history DTO. Amount is sats; asset amounts are exact raw-unit strings. */
export interface ArksatTransaction {
  id: string
  txid: string
  type: ArksatTransactionEvent['type']
  status: ArksatTransactionEvent['status']
  amount: number
  token: string
  address: string
  timestamp: number
  rail: ArksatTransactionEvent['rail']
  network: ArksatNetwork
  assets?: Array<ArksatAssetTransfer & { metadata?: Partial<ArksatIssueAssetMetadata> & { icon?: string } }>
}

export interface ArksatCapabilities {
  apiVersion: 2
  eventsVersion: 2
  methods: readonly DappMethod[]
  events: readonly ArksatProviderEvent[]
  networks: readonly ArksatNetwork[]
  signMessageTypes: readonly ArksatSignMessageType[]
}

export const ARKSAT_CAPABILITIES: ArksatCapabilities = {
  apiVersion: 2, eventsVersion: 2,
  methods: ARKSAT_PROVIDER_METHODS, events: ARKSAT_PROVIDER_EVENTS,
  networks: ['mainnet', 'mutinynet'], signMessageTypes: ['ecdsa', 'schnorr'],
}

/** Wire method parameters and results. Convenience aliases are not RPC methods. */
export interface ArksatRpcMap {
  connect: { params: [options?: ArksatConnectOptions]; result: string[] }
  disconnect: { params: []; result: void }
  isConnected: { params: []; result: boolean }
  getAccounts: { params: []; result: string[] }
  getAddress: { params: []; result: string }
  getPublicKey: { params: []; result: string }
  getNetwork: { params: []; result: ArksatNetworkInfo }
  getProviderState: { params: []; result: ArksatProviderState }
  getCapabilities: { params: []; result: ArksatCapabilities }
  getWalletSession: { params: []; result: ArksatWalletSession }
  getBalance: { params: []; result: ArksatBalance }
  getAssets: { params: []; result: ArksatAssetBalance[] }
  getAssetDetails: { params: [input: { assetId: string }]; result: ArksatAssetBalance | null }
  getAssetMetadata: { params: [input: { assetId: string }]; result: ArksatAssetDetails }
  issueAsset: { params: [input: ArksatIssueAssetParams]; result: ArksatIssueAssetResult }
  reissueAsset: { params: [input: ArksatAssetAmountParams]; result: { txid: string } }
  burnAsset: { params: [input: ArksatAssetAmountParams]; result: { txid: string } }
  getTransactionHistory: { params: [options?: ArksatHistoryOptions]; result: ArksatTransaction[] }
  getTransaction: { params: [input: { txid: string }]; result: ArksatTransaction | null }
  sendToAddress: { params: [address: string, amount: number]; result: string }
  sendAsset: { params: [address: string, assets: ArksatAssetTransfer[], bitcoinAmount?: number]; result: string }
  sendSwapFunding: { params: [input: ArksatSwapFundingParams]; result: string }
  signTransaction: { params: [input: ArksatSignTransactionParams & ArksatSessionGuard]; result: string }
  signTransactions: { params: [input: ArksatSignTransactionsParams & ArksatSessionGuard]; result: string[] }
  signMessage: { params: [message: string, type?: ArksatSignMessageType, encoding?: 'utf8' | 'hex', expected?: ArksatSessionGuard]; result: string }
  switchNetwork: { params: [network: ArksatNetwork]; result: void }
}
```
