# Release note — statement import fragment (0.0.1)

Internal test build. Not published to any store; no store credentials or signing material in this repository.

## Permissions actually needed

| Platform | Permission | Why |
|---|---|---|
| Android | `INTERNET` | HTTP calls to the import API |
| Android | — (no storage/media permission) | The system picker (Storage Access Framework) grants one-time access to the chosen `content://` document |
| iOS | — (no usage descriptions) | `UIDocumentPicker` in import mode hands the app a temporary copy; the user's original in Files is never modified |

Plain HTTP to the local mock: Android allows cleartext in **debug builds only** (`usesCleartextTraffic` placeholder, true for debug / false for release, set by the React Native Gradle plugin). iOS sets `NSAllowsLocalNetworking` in the shared `Info.plist`, so it is **also in release builds**: it allows plain HTTP only to local addresses (localhost, `*.local`, LAN IPs); ATS stays on for everything else (`NSAllowsArbitraryLoads = false`). Limiting it to Debug is a follow-up before any real release (TDR-003).

## Where copies of the file live

| Copy | Location | Removed when |
|---|---|---|
| Our private copy | App cache: `<caches>/statement-import/<uuid>.bin` (neutral name, not the user's file name) | Server accepted the upload · user cancels · file rejected (spoofed / > 10 MiB / empty) · terminal upload failure · "Clear local data" · recovery on launch / foreground removes any copy not referenced by the saved import |
| Picker staging copy | `<caches>/<uuid>/upload.bin` (created by the picker library) | Moved into our folder immediately and its folder deleted. Only a crash in that instant can leave it (in the OS-purgeable cache) |
| iOS `tmp/<bundle>-Inbox` | Temporary copy the OS creates for the picked file (import mode) | Moved into our folder immediately when accepted; deleted right away when rejected before copying (e.g. > 10 MiB). iOS clears `tmp/` itself |
| Persisted state | Encrypted MMKV (AES-256, key in Keychain/Keystore): idempotency key, file display name, size, format, job id/status/revision, report, delete key | "Start a new import" after deletion/failure · "Clear local data" · uninstall |

Statement bytes are never written anywhere else and are never logged. Android cloud backup and device-to-device transfer exclude all app data (`allowBackup="false"` + `data_extraction_rules.xml`).

## How to clear data

- In the app: **Clear local data** (removes every private copy and the persisted state; it does not delete server data and says so).
- Server data: **Delete import** → wait for "Deleted on the server" (confirmed by `GET status=deleted`).
- OS level: uninstall, or Android Settings → Apps → rn-pdf-parser → Storage → Clear storage. On iOS the Keychain key may survive an uninstall; it only protects an empty store afterwards.

## Signals that stop the rollout

- Any idempotency key producing more than one job (server `newJobs` per key > 1 / duplicate jobs per user).
- "Deleted" shown while the server still has the job (UI deletion confirmation without a server `deleted`).
- File names, statement bytes or transaction descriptions found in logs or crash reports.
- Crash-free sessions drop (especially OOM during upload on low-end Android — TDR-005).
- Import error rate by code spikes after release (e.g. `COPY_FAILED` on specific OEMs, `UNEXPECTED_RESPONSE`).

## JS/OTA vs new native binary

OTA is not used by this project (all releases go through store review). For reference:

| Change | Ships as |
|---|---|
| Screens, texts/i18n, toasts and loaders, compact layout / font-scale cap, validation rules, polling/retry logic, use cases, presenter rules | JS bundle |
| Mock/API address (`MOCK_API_URL` in `.env`, inlined at bundling) | JS bundle (rebuild with Metro `--reset-cache`) |
| Adding/upgrading any native module (picker, file-access, MMKV/Nitro, Keychain, Unistyles, screens, safe-area) | New binary |
| `AndroidManifest.xml`, network security / cleartext config, data-extraction rules, `Info.plist`/ATS | New binary |
| React Native upgrade, Gradle/NDK/CocoaPods changes, bundle id / signing | New binary |
