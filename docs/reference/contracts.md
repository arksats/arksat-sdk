# Method contracts

SDK 0.1.0 · extension 1.0.32 · Provider API 2 · events 2.

<!-- Derived from src/providerContract.ts. -->

These are raw Provider contracts. Client transfer and signing results use named fields; see the [API reference](../api.md). Amounts have no implicit conversion. Reads never request permissions; mutations never retry automatically. Networks: mainnet and mutinynet, except sendSwapFunding (mutinynet only). Detect support with getCapabilities.

| Method | Permission | Approval | Units | Return semantics |
| --- | --- | --- | --- | --- |
| connect | connect | approval | — | Authorized accounts |
| disconnect | connection | no | — | Origin disconnected |
| isConnected | none | no | — | Connection flag |
| getAccounts | accounts | no | — | Empty when unavailable |
| getAddress | accounts | no | — | Current address |
| getPublicKey | accounts | no | hex | Public key |
| getNetwork | network | no | — | Network information |
| getProviderState | none | no | — | Redacted before connection |
| getCapabilities | none | no | — | Supported methods |
| getWalletSession | accounts + network + boardingAddress | no | — | Public session snapshot |
| getBalance | balance | no | sats; asset raw strings | Wallet balance snapshot |
| getAssets | assets | no | raw integer strings | Held assets |
| getAssetDetails | assets | no | raw integer strings | Holding or null |
| getAssetMetadata | assets + accounts + network | no | raw supply string | Metadata; not a holding check |
| issueAsset | issueAsset (explicit) | every call | raw integer string | Submission, not finality |
| reissueAsset | reissueAsset (explicit) | every call | raw integer string | Submission, not finality |
| burnAsset | burnAsset (explicit) | every call | raw integer string | Submission, not finality |
| getTransactionHistory | transactions (explicit) | no | sats; asset raw strings | Retained wallet activity |
| getTransaction | transactions (explicit) | no | sats; asset raw strings | Retained record or null; not chain proof |
| sendToAddress | sendToAddress | every call | integer sats | Submitted txid |
| sendAsset | sendAsset | every call | raw asset strings; BTC sats | Submitted txid |
| sendSwapFunding | sendAsset | every call | raw asset strings; BTC sats | Funding txid, not completed swap |
| signTransaction | signTransaction | every call | base64 PSBT | Signed PSBT, no broadcast |
| signTransactions | signTransactions | every call | base64 PSBT[] | Signed PSBTs, no broadcast |
| signMessage | signMessage | every call | utf8 or hex | Hex signature |
| switchNetwork | switchNetwork | when changing | mainnet / mutinynet | Network selected |

## Raw RPC parameters and results

```ts
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

Invalid parameters use INVALID_PARAMS; missing grants use UNAUTHORIZED; locks use WALLET_LOCKED; context changes use CONTEXT_CHANGED. Rejected approvals use USER_REJECTED. Upstream calls may also fail with NETWORK_ERROR, RATE_LIMITED or TIMEOUT. See [errors](../errors.md).
