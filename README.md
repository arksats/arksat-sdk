# Arksat Wallet SDK

Typed integration for the Arksat browser extension: accounts, balances, tokens, transfers, signatures, and asset issuance.

[Documentation](https://docs.arksat.xyz/en/sdk/introduction) · [API reference](https://docs.arksat.xyz/en/api)

## Installation

SDK 0.1.0 is available on [npm](https://www.npmjs.com/package/@arksat/wallet-sdk).

```sh
npm install @arksat/wallet-sdk@0.1.0
```

The package is published as `@arksat/wallet-sdk`. See [release instructions](docs/releasing.md) for the maintainer preflight and publication command.

Requires the Arksat browser extension with Provider API 2 and events version 2. ESM; Node.js 18+ for the build environment. Wallet calls run in the browser.

## Usage

```ts
import { createArksatClient, waitForArksatProvider } from '@arksat/wallet-sdk'

export async function connectWallet() {
  const client = createArksatClient(await waitForArksatProvider())
  const { accounts } = await client.connect()
  const balance = await client.getBalance()
  return { client, accounts, balance }
}
```

Call from a user action and handle errors at the call site. The main entry point has no runtime dependencies. The optional `@arksat/wallet-sdk/arkade` entry point requires Arkade SDK 0.4.79 and @scure/base 2; its Node tooling follows Arkade's requirement of Node 22.12+ below 27. Direct transaction lookup additionally requires the extension to advertise getTransaction (local extension build 1.0.32).

ESM only: CommonJS require and legacy TypeScript moduleResolution=node are not supported. Use NodeNext, Node16 or bundler module resolution. The core SDK has been checked without optional peers; install them only for the /arkade entry point.

## License

[MIT](LICENSE).

## Guides

- [Quickstart](docs/quick-start.md)
- [Connection and permissions](docs/connection.md)
- [Assets](docs/assets.md)
- [Transfers](docs/transfers.md)
- [Asset issuance](docs/issuance.md)
- [Events](docs/events.md)
- [Amounts](docs/amounts.md)
- [Errors](docs/errors.md)
- [API reference](docs/api.md)
- [Arkade integration](docs/advanced.md)

Examples: [Connect](examples/connect.ts), [Issue a token](examples/issue-asset.ts).

After installation, run `node node_modules/@arksat/wallet-sdk/examples/serve.mjs` and open http://127.0.0.1:4174 for the complete browser example. It defaults to an in-memory mock wallet and includes transaction tracking and context cleanup.

[Developer tools and complete example](docs/developer-tools.md) · [Method contracts](docs/reference/contracts.md) · [Distribution and checksums](docs/distribution.md)

## Build from source

Use Node 22.12 or newer, below 27, to build with the optional Arkade dependency.

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run example
```

The example runs at http://127.0.0.1:4174. Run `npm pack` to build and create a local installation archive. See [release instructions](docs/releasing.md) before publishing to npm.
