import { createArksatClient, waitForArksatProvider, decimalAmountToRaw } from '@arksat/wallet-sdk'

/** Call only from a user gesture; displays grant and issuance approvals. */
export async function issueExampleToken() {
  const wallet = createArksatClient(await waitForArksatProvider())
  const capabilities = await wallet.getCapabilities()
  if (capabilities.apiVersion < 2 || !capabilities.methods.includes('issueAsset')) throw new Error('Update the wallet to support asset issuance')
  await wallet.connect({ actions: ['issueAsset'] })
  const session = await wallet.getWalletSession()
  return wallet.issueAsset({
    amount: decimalAmountToRaw('1000', 8),
    metadata: { name: 'Example Token', ticker: 'EX', decimals: 8 },
    expectedAddress: session.address,
    expectedNetwork: session.network.network,
    expectedSessionId: session.sessionId,
  })
}
