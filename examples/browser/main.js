import { createArksatClient, waitForArksatProvider, waitForTransaction, subscribe } from '/dist/index.js'
import { createMockProvider } from '/dist/mock.js'

const el = id => document.getElementById(id)
let provider, client, controller, txid, generation = 0, transferRevision = 0, stops = []
const log = message => { el('log').textContent = `${message}\n${el('log').textContent}`.slice(0, 12000) }
const showError = error => {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : 'ERROR'
  el('status').textContent = `${code}: ${error instanceof Error ? error.message : String(error)}. Check transaction status after a timeout; do not repeat the payment.`
}
function cleanup() {
  generation++
  controller?.abort()
  for (const stop of stops) stop()
  stops = []
  client = undefined; provider = undefined; txid = undefined
  el('send').disabled = el('query').disabled = el('confirm').disabled = el('disconnect').disabled = true
  el('connect').disabled = el('mock').disabled = false
}
function contextChanged() {
  cleanup()
  el('wallet').textContent = 'Wallet context changed. Reconnect to continue.'
  el('status').textContent = 'Stopped tracking the previous session. Check submitted transactions in your wallet.'
}
function showTransaction(tx) {
  if (!tx) { el('status').textContent = 'No retained wallet record found. This does not prove the transaction does not exist; query again later.'; return }
  log(`${tx.txid}: ${tx.status}`)
  el('status').textContent = {
    pending: 'Transaction pending. Wait or query its status.',
    confirmed: 'Wallet record shows confirmed. Merchant payments still require independent verification.',
    failed: 'Wallet record shows failed. Check the reason and the state of your funds.',
    cancelled: 'Wallet record shows cancelled. Check the state of your funds.',
    recoverable: 'Recovery required. Open the wallet to inspect it; do not repeat the payment.',
  }[tx.status] ?? `Unknown status: ${tx.status}`
  if (['confirmed', 'failed', 'cancelled'].includes(tx.status)) el('send').disabled = false
}
el('connect').onclick = async () => {
  cleanup()
  const run = generation
  el('connect').disabled = el('mock').disabled = true
  let candidate
  try {
    candidate = el('mock').checked ? createMockProvider() : await waitForArksatProvider()
    const next = createArksatClient(candidate)
    const capabilities = await next.getCapabilities()
    const required = ['getTransaction', 'sendToAddress', 'getBalance']
    if (capabilities.apiVersion !== 2 || required.some(method => !capabilities.methods.includes(method))) throw new Error('Install an Arksat extension that supports transaction ID lookup')
    const { accounts } = await next.connect({ read: ['transactions'] })
    if (run !== generation) return
    provider = candidate; client = next
    for (const event of ['account:changed', 'network:changed', 'wallet:locked', 'connection:disconnected']) stops.push(subscribe(provider, event, contextChanged))
    stops.push(subscribe(provider, 'transaction:updated', tx => log(`${tx.txid}: ${tx.status}`)))
    stops.push(subscribe(provider, 'balance:changed', async () => {
      try {
        const [network, balance] = await Promise.all([next.getNetwork(), next.getBalance()])
        if (run === generation) el('wallet').textContent = `${accounts[0]} · ${network.network} · Available ${balance.available} sats`
      } catch (error) { if (run === generation) showError(error) }
    }))
    const [network, balance] = await Promise.all([client.getNetwork(), client.getBalance()])
    if (run !== generation) return
    el('wallet').textContent = `${accounts[0]} · ${network.network} · Available ${balance.available} sats`
    el('send').disabled = el('disconnect').disabled = false
    el('status').textContent = candidate.mock ? 'Mock wallet connected. Send, then click Simulate confirmation.' : 'Real wallet connected. Sending requests approval and moves funds.'
    if (!candidate.mock && el('address').value === 'mock:recipient') el('address').value = ''
    log(`Connected; API ${capabilities.apiVersion}; events ${capabilities.eventsVersion}`)
  } catch (error) {
    if (run !== generation) return
    cleanup(); showError(error)
  }
}
el('disconnect').onclick = async () => {
  const active = provider
  cleanup()
  el('wallet').textContent = 'Disconnected'
  try { await active?.disconnect() } catch (error) { showError(error) }
}
el('send').onclick = async () => {
  const amount = Number(el('amount').value), address = el('address').value.trim()
  if (!client || !provider || !address || !Number.isSafeInteger(amount) || amount <= 0) { showError(new Error('Enter an address and a positive integer amount in sats')); return }
  const run = generation, transfer = ++transferRevision, activeProvider = provider
  controller?.abort()
  el('send').disabled = true
  el('query').disabled = el('confirm').disabled = true
  txid = undefined
  el('status').textContent = 'Waiting for wallet approval...'
  try {
    const result = await client.sendToAddress({ address, amount })
    if (run !== generation || transfer !== transferRevision) return
    txid = result.txid
    el('query').disabled = false
    el('confirm').disabled = !activeProvider.mock
    el('status').textContent = `Submitted ${txid}. Waiting for status; submission does not mean settlement.`
    log(`Submit ${txid}`)
    controller = new AbortController()
    const tx = await waitForTransaction(activeProvider, txid, { signal: controller.signal })
    if (run === generation && transfer === transferRevision) showTransaction(tx)
  } catch (error) {
    if (run !== generation || transfer !== transferRevision) return
    showError(error)
    // A timeout may already have moved funds. Only an explicit rejection is safe to resubmit here.
    if (error?.code === 'USER_REJECTED' || error?.code === 'INVALID_PARAMS' || error?.code === 'INSUFFICIENT_FUNDS') el('send').disabled = false
  }
}
el('query').onclick = async () => {
  const run = generation, transfer = transferRevision
  try { const tx = await client.getTransaction({ txid }); if (run === generation && transfer === transferRevision) showTransaction(tx) }
  catch (error) { if (run === generation && transfer === transferRevision) showError(error) }
}
el('confirm').onclick = () => { if (provider?.mock && txid) provider.mock.setTransactionStatus(txid, 'confirmed') }
window.addEventListener('pagehide', cleanup, { once: true })
