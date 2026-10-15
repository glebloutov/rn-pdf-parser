# ADR-003: Encrypted local state with a Keychain/Keystore key

- **Status:** Accepted
- **Date:** 2026-10-14
- **Authors:** Gleb (with AI assistance — see `SELF_REVIEW.md`)
- **Deciders:** Gleb

---

## Context

Before the POST the app must persist the idempotency key and minimal state, which includes the file name and the private copy path. Standards forbid AsyncStorage and require sensitive data to be in Keychain/Keystore-backed storage.

## Decision

State is stored in `react-native-mmkv` (AES-256). The 32-character key is generated once (uuid v4 from the secure RNG polyfill) and stored with `react-native-keychain` as `WhenUnlockedThisDeviceOnly`. Unreadable or unknown-schema data is treated as 'no import'. Android backup and device transfer are disabled for all app data.

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Plain MMKV | File name and keys would be readable from a device backup or rooted device. |
| Keychain for the whole state | Asynchronous, size-limited and awkward for a synchronous `useSyncExternalStore` source. |
| AsyncStorage | Forbidden by the standards. |

## Consequences

### Positive
- Nothing statement-related is stored unencrypted.
- Synchronous reads keep the UI simple and relaunch-safe.

### Negative / Trade-offs
- One more native dependency (Keychain).
- iOS Keychain items can survive an uninstall; a fresh install then reuses the key on an empty store (harmless).

### Risks
- Keychain unavailable at boot → app shows a boot-failure screen instead of running without protection.

---

## References

- `docs/decisions.md`
- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
