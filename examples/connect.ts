import { waitForArksatProvider, subscribe } from '@arksat/wallet-sdk'

export async function mountWallet(onChange: (accounts: string[]) => void) {
  const provider = await waitForArksatProvider()
  const stop = subscribe(provider, 'account:changed', onChange)
  try {
    onChange((await provider.getProviderState()).accounts)
    return {
      // Invoke from a button; mounting never prompts.
      connect: () => provider.connect(),
      dispose: stop,
    }
  } catch (error) { stop(); throw error }
}
