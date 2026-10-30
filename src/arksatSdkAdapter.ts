import {
  DefaultVtxo, DelegateVtxo, ReadonlySingleKey, RestArkProvider, RestDelegateProvider, Transaction,
  Wallet, type Identity, type WalletConfig, type RelativeTimelock, type StorageConfig,
  CachingArkProvider,
} from '@arkade-os/sdk'
import { base64, hex } from '@scure/base'
import type { ArksatProvider, ArksatWalletSession, ArksatRelativeTimelock } from './providerContract.js'

type SessionProvider = Pick<ArksatProvider, 'request'>
export class ArksatSessionChanged extends Error {}

function xOnly(key: string): string {
  if (/^[0-9a-f]{64}$/i.test(key)) return key.toLowerCase()
  if (/^(02|03)[0-9a-f]{64}$/i.test(key)) return key.slice(2).toLowerCase()
  throw new Error('Invalid wallet session public key')
}

function timelock(value: ArksatRelativeTimelock): RelativeTimelock {
  if (!value || !['blocks', 'seconds'].includes(value.type) || !/^[0-9]+$/.test(value.value)) {
    throw new Error('Invalid wallet session timelock')
  }
  const parsed = BigInt(value.value)
  if (parsed <= 0n) throw new Error('Invalid wallet session timelock')
  return { type: value.type, value: parsed }
}

export async function assertArksatSession(provider: SessionProvider, session: ArksatWalletSession): Promise<void> {
  const current = await provider.request({ method: 'getWalletSession' }) as ArksatWalletSession
  if (current.sessionId !== session.sessionId || current.address !== session.address ||
      current.publicKey !== session.publicKey || current.network.network !== session.network.network) {
    throw new ArksatSessionChanged('Wallet session changed. Please reconnect.')
  }
}

/** Use SDK provider/configuration APIs only. Never modify the SDK wallet or scripts. */
export async function createArksatSdkConfig(session: ArksatWalletSession): Promise<Pick<WalletConfig,
  'arkServerUrl' | 'arkProvider' | 'delegateProvider' | 'exitTimelock' | 'boardingTimelock' |
  'walletMode' | 'settlementConfig' | 'renewalConfig'>> {
  if (session.version !== 1 || !session.sessionId || !/^(02|03)[0-9a-f]{64}$/i.test(session.publicKey) ||
      !['mainnet', 'mutinynet'].includes(session.network.network) || session.sdk.walletMode !== 'static') {
    throw new Error('Unsupported wallet session. Update the extension and reconnect.')
  }
  for (const url of [session.network.arkServerUrl, session.network.delegateUrl].filter(Boolean)) {
    if (new URL(url!).protocol !== 'https:') throw new Error('Invalid wallet session service URL')
  }
  const serverKey = xOnly(session.sdk.serverPublicKey)
  const options = { pubKey: hex.decode(xOnly(session.publicKey)), serverPubKey: hex.decode(serverKey),
    csvTimelock: timelock(session.sdk.exitTimelock) }
  const delegateKey = session.sdk.delegatePublicKey
  if (Boolean(delegateKey) !== Boolean(session.network.delegateUrl)) throw new Error('Invalid wallet session delegate configuration')
  const script = delegateKey
    ? new DelegateVtxo.Script({ ...options, delegatePubKey: hex.decode(xOnly(delegateKey)) })
    : new DefaultVtxo.Script(options)
  if (script.address(session.network.network === 'mainnet' ? 'ark' : 'tark', options.serverPubKey).encode() !== session.address) {
    throw new Error('Wallet session address does not match its public script')
  }
  const arkProvider = new CachingArkProvider(new RestArkProvider(session.network.arkServerUrl), 5000)
  const delegateTransport = session.network.delegateUrl && delegateKey ? new RestDelegateProvider(session.network.delegateUrl) : null
  const [info, delegateInfo] = await Promise.all([arkProvider.getInfo(), delegateTransport?.getDelegateInfo()])
  if (xOnly(info.signerPubkey) !== serverKey ||
      (session.network.network === 'mainnet' ? info.network !== 'bitcoin' : info.network !== 'mutinynet')) {
    throw new ArksatSessionChanged('Arkade server configuration changed. Refresh the wallet session.')
  }
  let delegateProvider: RestDelegateProvider | undefined
  if (session.network.delegateUrl && delegateKey) {
    // Preflight OUTSIDE Wallet.create: SDK 0.4.79 otherwise silently omits the
    // delegate path when getDelegateInfo fails, deriving a different address.
    if (!delegateInfo || xOnly(delegateInfo.pubkey) !== xOnly(delegateKey)) throw new ArksatSessionChanged('Delegate key changed. Refresh the wallet session.')
    class SessionDelegateProvider extends RestDelegateProvider {
      override async getDelegateInfo() { return { ...delegateInfo! } }
    }
    delegateProvider = new SessionDelegateProvider(session.network.delegateUrl)
  }
  return {
    arkServerUrl: session.network.arkServerUrl, arkProvider, delegateProvider,
    exitTimelock: options.csvTimelock, boardingTimelock: timelock(session.sdk.boardingTimelock),
    walletMode: 'static', settlementConfig: false, renewalConfig: { enabled: false },
  }
}

export async function assertArksatSdkWallet(session: ArksatWalletSession, wallet: Pick<Wallet, 'getAddress' | 'getBoardingAddress'>): Promise<void> {
  const [address, boardingAddress] = await Promise.all([wallet.getAddress(), wallet.getBoardingAddress()])
  if (address !== session.address || boardingAddress !== session.boardingAddress) {
    throw new ArksatSessionChanged('SDK wallet differs from the extension session. Please reconnect.')
  }
}

export function createArksatSdkIdentity(provider: SessionProvider, session: ArksatWalletSession,
  assertActive: () => void = () => {}): Identity & {
    signMultiple: (requests: Array<{ tx: Transaction; inputIndexes?: number[] }>) => Promise<Transaction[]>
  } {
  const readonly = ReadonlySingleKey.fromPublicKey(hex.decode(session.publicKey))
  const expected = { expectedAddress: session.address, expectedNetwork: session.network.network, expectedSessionId: session.sessionId }
  const guard = async () => {
    assertActive()
    await assertArksatSession(provider, session)
    assertActive()
  }
  const merge = (tx: Transaction, encoded: unknown) => {
    if (typeof encoded !== 'string') throw new Error('Invalid extension signing response')
    const signed = Transaction.fromPSBT(base64.decode(encoded))
    if (hex.encode(tx.unsignedTx) !== hex.encode(signed.unsignedTx)) throw new Error('Extension changed the unsigned transaction')
    return tx.clone().combine(signed)
  }
  return {
    compressedPublicKey: () => readonly.compressedPublicKey(),
    xOnlyPublicKey: () => readonly.xOnlyPublicKey(),
    signerSession: () => { throw new Error('Execute settlement in the extension wallet') },
    sign: async (tx, inputIndexes) => {
      await guard()
      const signed = await provider.request({ method: 'signTransaction', params: [{
        psbtBase64: base64.encode(tx.toPSBT()), inputIndexes, ...expected,
      }] })
      await guard()
      return merge(tx, signed)
    },
    signMultiple: async requests => {
      await guard()
      const signed = await provider.request({ method: 'signTransactions', params: [{
        transactions: requests.map(({ tx, inputIndexes }) => ({ psbtBase64: base64.encode(tx.toPSBT()), inputIndexes })),
        ...expected,
      }] })
      await guard()
      if (!Array.isArray(signed) || signed.length !== requests.length) throw new Error('Invalid extension signing response')
      return requests.map(({ tx }, index) => merge(tx, signed[index]))
    },
    signMessage: async (message, type) => {
      await guard()
      const signed = await provider.request({ method: 'signMessage', params: [hex.encode(message), type, 'hex', expected] })
      await guard()
      if (typeof signed !== 'string' || !/^(?:[0-9a-f]{2})+$/i.test(signed)) throw new Error('Invalid extension signature')
      return hex.decode(signed)
    },
  }
}

export async function createArksatSdkWallet(provider: SessionProvider, options: {
  storage: StorageConfig
  assertActive?: () => void
  expectedNetwork?: ArksatWalletSession['network']['network']
  expectedArkServerUrl?: string
}) {
  options.assertActive?.()
  const session = await provider.request({ method: 'getWalletSession' }) as ArksatWalletSession
  if ((options.expectedNetwork && options.expectedNetwork !== session.network.network) ||
      (options.expectedArkServerUrl && options.expectedArkServerUrl.replace(/\/+$/, '') !== session.network.arkServerUrl.replace(/\/+$/, ''))) {
    throw new ArksatSessionChanged('The extension and dApp use different Arkade networks or services')
  }
  const config = await createArksatSdkConfig(session)
  const identity = createArksatSdkIdentity(provider, session, options.assertActive)
  const assertActive = async () => {
    options.assertActive?.()
    await assertArksatSession(provider, session)
    options.assertActive?.()
  }
  await assertActive()
  const wallet = await Wallet.create({ ...config, identity, storage: options.storage })
  try {
    await assertArksatSdkWallet(session, wallet)
    await assertActive()
  } catch (error) {
    await wallet.dispose()
    throw error
  }
  return { wallet, identity, session, assertActive, dispose: () => wallet.dispose() }
}
