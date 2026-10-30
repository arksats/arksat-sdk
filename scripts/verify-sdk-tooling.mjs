import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { createArksatClient, waitForTransaction, waitForArksatProvider, isArksatProviderError, formatRawAssetAmount } from '../dist/index.js'
import { serializeProviderError } from '../dist/providerErrors.js'
import { createMockProvider } from '../dist/mock.js'
import { runConformance } from '../dist/conformance.js'

await test('mock enforces history grants, rejection, balances, and cloned results', async () => {
  const provider = createMockProvider({ balance: 2000 })
  const client = createArksatClient(provider)
  await assert.rejects(client.getBalance(), error => error.code === 'UNAUTHORIZED')
  await client.connect()
  await assert.rejects(client.getTransaction({ txid: 'unknown' }), error => error.code === 'UNAUTHORIZED')
  provider.mock.rejectNext()
  await assert.rejects(client.sendToAddress({ address: 'mock:recipient', amount: 1000 }), error => error.code === 'USER_REJECTED')
  assert.equal((await client.getBalance()).available, 2000)
  await client.connect({ read: ['transactions'] })
  const { txid } = await client.sendToAddress({ address: 'mock:recipient', amount: 1000 })
  assert.equal((await client.getBalance()).available, 1000)
  const first = await client.getTransaction({ txid })
  assert.equal(first.status, 'pending')
  first.status = 'confirmed'
  assert.equal((await client.getTransaction({ txid })).status, 'pending')
  await assert.rejects(client.sendToAddress({ address: 'mock:recipient', amount: 1001 }), error => error.code === 'INSUFFICIENT_FUNDS')
  assert.equal((await client.getTransactionHistory()).length, 1)
  provider.mock.setLocked(true)
  assert.equal(await provider.isConnected(), true)
  assert.deepEqual(await provider.getAccounts(), [])
  assert.equal((await provider.getProviderState()).isUnlocked, false)
  assert.equal((await provider.getNetwork()).network, 'mutinynet')
  await assert.rejects(client.getTransaction({ txid }), error => error.code === 'WALLET_LOCKED')
})

await test('duplicate asset entries cannot overspend or partially mutate balances', async () => {
  const assetId = 'ab'.repeat(34)
  const provider = createMockProvider({ assets: [{ assetId, amount: '9007199254740993', rawAmount: '9007199254740993', displayAmount: 9007199254740992 }] })
  await provider.connect({ read: ['transactions'] })
  await assert.rejects(provider.sendAsset('mock:recipient', [{ assetId, amount: '9007199254740993' }, { assetId, amount: '1' }]), error => error.code === 'INSUFFICIENT_FUNDS')
  assert.equal((await provider.getAssets())[0].amount, '9007199254740993')
  assert.equal((await provider.getTransactionHistory()).length, 0)
  await provider.sendAsset('mock:recipient', [{ assetId, amount: '1' }])
  assert.equal((await provider.getAssets())[0].amount, '9007199254740992')
})

await test('pending approval cannot spend after account changes', async () => {
  let release
  const provider = createMockProvider({ approve: method => method === 'sendToAddress' ? new Promise(resolve => { release = resolve }) : true })
  await provider.connect()
  const send = provider.sendToAddress('mock:recipient', 1)
  const rejected = assert.rejects(send, error => error.code === 'CONTEXT_CHANGED')
  provider.mock.setAccount('mock:account-2')
  release(true)
  await rejected
  await provider.connect({ read: ['transactions'] })
  assert.equal((await provider.getTransactionHistory()).length, 0)
  assert.equal((await provider.getBalance()).available, 0)
})

await test('direct status wait sees older records and cleans subscriptions', async () => {
  const records = Array.from({ length: 151 }, (_, i) => ({ id: `id-${i}`, txid: `hash-${i}`, type: 'send', status: 'confirmed', amount: 1, token: 'BTC', address: 'mock:r', timestamp: i, rail: 'ark', network: 'mutinynet' }))
  const provider = createMockProvider({ transactions: records })
  await provider.connect({ read: ['transactions'] })
  assert.equal((await waitForTransaction(provider, 'hash-0')).id, 'id-0')
  assert.equal(provider.mock.listenerCount(), 0)
  assert.equal(await provider.getTransaction({ txid: 'missing' }), null)
})

await test('failed and recoverable statuses are results, never success promises', async () => {
  const provider = createMockProvider()
  await provider.connect({ read: ['transactions'] })
  const txid = await provider.sendToAddress('mock:r', 1)
  const waiting = waitForTransaction(provider, txid)
  provider.mock.setTransactionStatus(txid, 'failed')
  assert.equal((await waiting).status, 'failed')
  provider.mock.setTransactionStatus(txid, 'recoverable')
  assert.equal((await waitForTransaction(provider, txid)).status, 'recoverable')
  assert.equal(provider.mock.listenerCount(), 0)
})

await test('abort, timeout and context changes clean all wait listeners', async () => {
  for (const mode of ['abort', 'timeout', 'lock', 'disconnect', 'network']) {
    const provider = createMockProvider()
    await provider.connect({ read: ['transactions'] })
    const txid = await provider.sendToAddress('mock:r', 1)
    const controller = new AbortController()
    const waiting = waitForTransaction(provider, txid, { signal: controller.signal, timeoutMs: mode === 'timeout' ? 10 : 1000 })
    const rejected = assert.rejects(waiting, error => mode === 'abort' || error.code === (mode === 'timeout' ? 'TIMEOUT' : 'CONTEXT_CHANGED'))
    if (mode === 'abort') controller.abort()
    if (mode === 'lock') provider.mock.setLocked(true)
    if (mode === 'disconnect') await provider.disconnect()
    if (mode === 'network') await provider.switchNetwork('mainnet')
    await rejected
    assert.equal(provider.mock.listenerCount(), 0, mode)
  }
})

await test('mock advertises only implemented methods and never pretends to sign', async () => {
  const provider = createMockProvider()
  const capabilities = await provider.getCapabilities()
  assert.ok(!capabilities.methods.includes('signTransaction'))
  await assert.rejects(provider.signTransaction({ psbtBase64: '' }), error => error.code === 'UNSUPPORTED_METHOD')
  await assert.rejects(provider.request({ method: 'signMessage', params: ['hello'] }), error => error.code === 'UNSUPPORTED_METHOD')
  await provider.request({ method: 'connect' })
  assert.equal((await provider.request({ method: 'getBalance' })).available, 100000)
})

await test('conformance never connects, pays, signs, or upgrades permissions', async () => {
  let approvals = 0
  const provider = createMockProvider({ approve: () => { approvals++; return true } })
  assert.equal((await runConformance(provider)).ok, true)
  assert.equal(approvals, 0)
  assert.equal(provider.mock.listenerCount(), 0)
  await provider.connect()
  const report = await runConformance(provider, { readAuthorized: true, transactionId: 'unknown' })
  assert.equal(report.ok, false)
  assert.equal(report.checks.find(check => check.name === 'transaction-lookup').status, 'fail')
  assert.equal(approvals, 1)
})

await test('conformance detects missing methods and bounds stalled reads', async () => {
  const provider = createMockProvider()
  const broken = { ...provider, getBalance: undefined }
  assert.equal((await runConformance(broken)).ok, false)
  const hung = { ...provider, getCapabilities: () => new Promise(() => {}) }
  const report = await runConformance(hung, { timeoutMs: 10 })
  assert.equal(report.ok, false)
  assert.match(report.checks[0].detail, /timed out/)
  const empty = { ...provider, getCapabilities: async () => ({ apiVersion: 2, eventsVersion: 2, methods: [], events: [], networks: [] }) }
  assert.equal((await runConformance(empty)).ok, false)
})

await test('structured errors survive clone and realm changes; mutations stay non-retryable', () => {
  const foreign = runInNewContext('({ code: "RATE_LIMITED", message: "busy", retryable: true, retryAfter: 2 })')
  assert.equal(isArksatProviderError(foreign), true)
  assert.equal(isArksatProviderError({ code: 'invented', message: 'busy', retryable: true }), false)
  assert.deepEqual(serializeProviderError(foreign, 'getTransaction'), { code: 'RATE_LIMITED', message: 'busy', retryable: true, retryAfter: 2 })
  assert.equal(serializeProviderError(foreign, 'sendToAddress').retryable, false)
})

await test('public formatting rejects unknown, fractional and unbounded precision', () => {
  for (const decimals of [undefined, null, '8', -1, 1.5, NaN, Infinity, 19, 1000000000]) {
    assert.throws(() => formatRawAssetAmount('100', decimals), /decimals/)
  }
  assert.equal(formatRawAssetAmount('1000000000000000001', 18), '1.000000000000000001')
  assert.equal(formatRawAssetAmount('0', 0), '0')
})

await test('invalid timer options reject before subscribing or invoking wallet methods', async () => {
  const provider = createMockProvider()
  for (const timeoutMs of [NaN, Infinity, -1, 2147483648]) {
    await assert.rejects(waitForTransaction(provider, 'mock-tx', { timeoutMs }), TypeError)
    await assert.rejects(waitForArksatProvider({ timeoutMs }), TypeError)
  }
  await assert.rejects(waitForTransaction(provider, 'mock-tx', { pollIntervalMs: Infinity }), TypeError)
  assert.equal(provider.mock.listenerCount(), 0)
})
