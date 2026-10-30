# Errors

Errors from the Provider expose `code`, `message`, `retryable`, and optional `retryAfter` in seconds. Check code rather than relying on instanceof across scripts. Local utilities and cancellation may throw ordinary errors.

SDK 0.1.0 exports isArksatProviderError(error), a structural guard that also accepts valid errors from other bundles, realms and structured-clone transports. It checks the known code, message and retryable fields without requiring instanceof.

| Code | Handling |
| --- | --- |
| USER_REJECTED | Preserve input and wait for another user action |
| UNAUTHORIZED | Request the required connection permissions |
| WALLET_LOCKED | Ask the user to unlock |
| CONTEXT_CHANGED | Discard the old session and reload |
| UNSUPPORTED_METHOD | Check capabilities |
| INVALID_PARAMS | Correct inputs |
| INSUFFICIENT_FUNDS | Check available BTC and tokens |
| QUOTE_EXPIRED | Refresh the quote |
| RATE_LIMITED | Wait according to retryAfter and reduce concurrency |
| TIMEOUT | Check transaction state before retrying |
| NETWORK_ERROR | Show the error and allow reads to refresh |
| EXTENSION_DISCONNECTED | Check the extension and reconnect |
| INTERNAL_ERROR | Report non-sensitive diagnostics |

```ts
export function walletErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if (error.code === 'USER_REJECTED') return 'Request cancelled'
    if (error.code === 'CONTEXT_CHANGED') return 'Wallet changed. Reconnect.'
  }
  return error instanceof Error ? error.message : 'Wallet request failed'
}
```

## Retry policy
Only retry reads explicitly marked retryable, using bounded backoff. The SDK does not remove upstream HTTP 429 limits.

Do not automatically retry payments, asset mutations, or signatures. A timeout may occur after submission.
