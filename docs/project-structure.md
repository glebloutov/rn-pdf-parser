# Project structure and flows

Map of every folder/file in the repository (excluding generated `node_modules/`, `ios/Pods/`, build outputs) and of every runtime/test flow with the files it passes through, in call order.

Layer rule (statement import feature, simplified hexagonal): `ui → module → useCases → domain`; use cases depend only on `ports.ts`; `adapters/` implement the ports; `module.ts` binds use cases to ports; `app/bootstrap` wires the device adapters. `shared/` imports nothing from `features/`; nothing imports `app/`.

---

## 1. Root

| Path | Description |
|---|---|
| `README.md` | Clean checkout, run, tests, Maestro, manual acceptance matrix, per-platform results |
| `RELEASE_NOTES.md` | Permissions, where file copies live, how to clear data, rollout stop signals, JS vs native-binary boundary |
| `SELF_REVIEW.md` | Decisions, simplifications, first production failures, AI usage |
| `package.json` / `package-lock.json` | Exact-pinned dependencies; scripts (`mock*`, `test*`, `typecheck`, `e2e*`, `pods`) |
| `.nvmrc` | Node 26 for nvm users (optional; any Node `^22.13` / `^24.3` / `≥ 26` works) |
| `.env.example` | `MOCK_API_URL` template; copy to `.env` (git-ignored) only for a physical device / no `adb reverse` |
| `index.js` | Entry: loads theme + i18n first, registers `App` |
| `app.json` | Registered app name (`RnPdfParser`) and display name (`rn-pdf-parser`) |
| `babel.config.js` | RN preset, react-native-dotenv (`@env`), export-namespace-from (zod 4), Unistyles plugin, path aliases `@app`, `@shared`, `@features`, `@test-support` |
| `metro.config.js` | Default Metro config |
| `tsconfig.json` | App typecheck (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), no Node types |
| `tsconfig.test.json` | Tests typecheck (adds Jest + Node types, includes `jest/`) |
| `jest.config.js` | Jest projects: `unit`, `integration` (node env), `ui` (RN preset) |
| `.eslintrc.js` | `@react-native` config, `curly: all`, Jest env for test files, ignores `mock-server/`, `docs/` |
| `.prettierrc.js` | Formatting (single quotes, trailing commas, `arrowParens: avoid`) |
| `.gitignore`, `.watchmanconfig`, `Gemfile(.lock)`, `.bundle/`, `vendor/` | RN scaffold tooling (CocoaPods via Bundler) |

## 2. `src/app/` — composition and app shell

| Path | Description |
|---|---|
| `App.tsx` | Boot state (loading / failed / ready) → feature providers → `NavigationContainer` |
| `bootstrap/createAppModules.ts` | App composition root: Keychain key → device adapters (API, picker, files, encrypted store) → `createStatementImportModule`; diagnostics module; logger (dev only) |
| `bootstrap/useAppModules.ts` | Creates modules once (async: Keychain key) and exposes the boot state |
| `bootstrap/BootFailure.tsx` | Shown when secure storage can't be initialised |
| `navigation/RootNavigator.tsx` | Native stack: `ImportHome`, `ChargeDetails`, `Diagnostics` (dev only); header title 16 pt, centred on both platforms |
| `navigation/DiagnosticsHeaderButton.tsx` | Header button to Diagnostics (dev only); label grows with the system font up to 1.5× |
| `navigation/HeaderBackButton.tsx` | Back chevron without text/background (iOS 26 glass capsule opt-out), used on ChargeDetails and Diagnostics (iOS) |
| `i18n/i18n.ts` | i18next init: EN/RU resources per feature, device language via `react-native-localize` |
| `i18n/i18next.d.ts` | Typed translation keys |
| `@types/env.d.ts` | Types for `@env` (react-native-dotenv) |
| `@types/globals.d.ts` | Type of Hermes' global `atob` |
| `theme/init.ts` | Unistyles theme + breakpoints registration (`shared` theme, `compact` / `regular`) |

## 3. `src/shared/` — cross-feature, no feature imports

| Path | Description |
|---|---|
| `result/Result.ts` | `Result<T, E>` + `ok` / `err` |
| `logger/ILogger.ts` | Logger port with **allow-listed fields only** (`code`, `jobId`, `phase`, `revision`, `status`) |
| `logger/LogEvent.ts` | Enumerated log events |
| `logger/ConsoleLogger.ts` | JSON console logs, enabled in dev builds only |
| `logger/NoopLogger.ts` | Silent logger (tests) |
| `config/apiConfig.ts` | `API_BASE_URL` = `MOCK_API_URL` from `.env` (validated) or default `http://127.0.0.1:8787`; request timeout |
| `config/baseUrlSchema.ts` | Zod: http(s) URL, trimmed, no trailing slash (validates `MOCK_API_URL`) |
| `ids/generateKey.ts` | uuid v4 (secure RNG polyfill) — idempotency / delete keys, copy names |
| `net/fetchWithTimeout.ts` | `fetch` + `AbortController` timeout (Hermes-safe) |
| `encoding/base64.ts` | base64 → bytes via global `atob` (native file reads return base64) |
| `format/formatMoney.ts`, `formatDate.ts`, `fileSize.ts` | `Intl`-based money / date (UTC) / size formatting |
| `i18n/en.ts`, `ru.ts`, `supportedLanguages.ts` | Common strings, languages, fallback |
| `navigation/routes.ts` | `Routes` enum + `RootStackParamList` |
| `constants/statusBar.ts` | Status bar style |
| `theme/colors.ts`, `theme.ts` | Palette and semantic tokens (backgrounds, text, spacing, radius, font sizes, 48dp touch target); font sizes and spacing are smaller on compact screens |
| `theme/breakpoints.ts` | Width breakpoints (`compact` < 390 pt/dp ≤ `regular`) + `compactOr(compact, regular)` token helper |
| `theme/fontScale.ts` | `MAX_FONT_SCALE = 2`: text follows the system font up to 2× |
| `components/Button/` | Accessible button (role/state, loading, ≥48dp, variants) |
| `components/Banner/` | Persistent state message with tone (import status, deletion not confirmed), live region |
| `components/Toast/` | `ToastProvider` + `useToast`: one success / warning / error notification at a time, top of the screen, auto-hides, never takes touches, announced to screen readers |
| `components/ScreenLoader/` | Spinner + text in the middle of the screen (boot, first Diagnostics load, relaunch with an unconfirmed upload) |
| `components/Card/` | Bordered section with optional header |
| `components/KeyValueRow/` | Wrapping label/value row (large-font safe) |
| `components/HintText/` | Secondary text |
| `icons/ChevronLeftIcon/` | Back chevron drawn with plain views (no icon library) |
| `components/ScreenContainer/` | Safe-area scroll container for every screen |
| `**/__tests__/*.unit.test.ts` | base64 and formatting tests |
| `components/__tests__/feedback.ui.test.tsx` | ScreenLoader and Toast (shown, announced, no touches, auto-hide) |

## 4. `src/features/statementImport/` — the import feature (simplified hexagonal)

One scenario = one file in `useCases/`; rules in `domain/`; everything outside the app behind `ports.ts`.

| Path | Description |
|---|---|
| `domain/statementImport.ts` | Pure rules: server job types, failure codes, the import aggregate (phases, deletion state, `applySnapshot` **revision guard**, transitions), monthly total |
| `domain/validateFile.ts` | Pure rules: 10 MiB limit, sniffing that mirrors the server (`%PDF-`, CSV header), `validateStatementFile` |
| `ports.ts` | All interfaces use cases need: `IImportApi`, `IFilePicker`, `IFileStore`, `IImportStore`, `IImportDeps` (+ `now`, `generateKey`, logger), error codes |
| `useCases/selectFile.ts` | Pick → private copy → measure + sniff → draft with a new idempotency key, or reject and delete the copy |
| `useCases/submitImport.ts` | Persist `submitting` → POST → submitted / uncertain / failed; deletes the copy when done |
| `useCases/recoverImport.ts` | Launch / foreground / "Check again": removes orphan copies, then by-key lookup or GET; never re-sends; interrupted delete → not confirmed |
| `useCases/refreshJob.ts` | GET through the revision guard (polling, focus, Refresh); reports a strictly older answer as `outdatedSnapshot`; exports `applyJobResponse` |
| `useCases/requestDeletion.ts` | Persist delete key → DELETE → accepted (`deleting`) or not confirmed |
| `useCases/discardImport.ts` | `'currentImport'`: cancel draft / close failed or deleted import · `'allLocalData'`: Clear local data |
| `module.ts` | Composition: binds use cases to ports, gate (one operation at a time; a concurrent call gets `OPERATION_IN_PROGRESS`), read side for the UI (current import + ignored outdated answers) |
| `adapters/importApi.ts` | Zod response schemas, anti-corruption parsing, ASCII `X-File-Name`, `HttpImportApi` (fetch, status → error code) |
| `adapters/filePicker.ts` | `DocumentPickerAdapter`: iOS import / Android open mode, `keepLocalCopy`, move to our folder; guard: never moves an iOS source outside the app's `tmp/`; deletes the iOS temp copy of rejected files |
| `adapters/fileStore.ts` | Copies-folder paths + `FileAccessStorage` (stat, head read, read, unlink, list our copies) |
| `adapters/importStore.ts` | Zod schema of the stored import, versioned (de)serialisation, Keychain encryption key, `MmkvImportStore` (AES-256 MMKV) |
| `ui/StatementImportContext.tsx` | Provider + `useStatementImportModule` |
| `ui/statusPresenter.ts` | **Pure**: import → status key, tone, hint, deletion message, allowed actions; home step; error code → message key; `toStatusToast(previous, next)` → which toast a change deserves |
| `ui/hooks/useImportSession.ts` | Launch/foreground recovery (retried if the gate is busy) + polling (`setInterval` 1 s while pending, stopped in background); returns `isLaunchRecovering` |
| `ui/hooks/useCurrentImport.ts` | `useSyncExternalStore` over the persisted import |
| `ui/hooks/useOutdatedResponses.ts` | Outdated server answers ignored for the current job (shown in dev builds — stale_status evidence) |
| `ui/hooks/useImportHomeScreen.ts`, `useConfirmFilePanel.ts`, `useImportStatusPanel.ts`, `useChargeDetailsScreen.ts` | Screen/panel logic (react-conventions `useScreenName`); action errors and status changes → toasts |
| `ui/screens/ImportHomeScreen/` | Renders empty state / confirm panel / status panel + clear-local-data section; a centred loader while an unconfirmed upload is looked up after a relaunch |
| `ui/screens/ChargeDetailsScreen/` | Read-only charge card (no cancel action) |
| `ui/components/` | `ImportEmptyState`, `ConfirmFilePanel`, `ImportStatusPanel` (`StatusSummary`, `StatusActions`, `ReportCard` → `ChargeRow`), `ClearLocalDataSection` |
| `constants/testIds.ts`, `i18n/en.ts`, `i18n/ru.ts` | Selectors for RNTL/Maestro, strings + error catalog |
| `domain/__tests__/` | Validator (real fixtures, edges), aggregate, money |
| `useCases/__tests__/` | One test file per use case + `cleanup`; `support/`: fakes (`InMemoryImportStore`, `FakeFileStore`, `FakeFilePicker`, `FakeImportApi`), fixtures, `createTestModule` (relaunch = new module on the same "device") |
| `adapters/__tests__/` | Header name, response parsing, stored-state parsing, paths; `acceptanceMatrix.integration.test.ts` (real mock) |
| `ui/__tests__/` | Presenter tests, RU/EN catalog parity, `ImportFlow.ui.test.tsx` (RNTL) |

## 5. `src/features/diagnostics/` — dev-only reviewer tool (simple tier)

| Path | Description |
|---|---|
| `ports.ts` | `/__test/state`, `/__test/scenario`, `/__test/reset` contract, scenarios list |
| `adapters/HttpMockControlClient.ts` | HTTP implementation |
| `adapters/mockStateSchema.ts` | Zod schema of `/__test/state` |
| `ui/DiagnosticsContext.tsx` | Provider + hook |
| `ui/hooks/useDiagnosticsScreen.ts` | Load state on focus, switch scenario, reset; exposes the address in use |
| `ui/screens/DiagnosticsScreen/` | Screen composition |
| `ui/components/ScenarioPicker/`, `MockStatePanel/` | Scenario buttons, counters + jobs |
| `constants/testIds.ts`, `i18n/en.ts`, `i18n/ru.ts` | Selectors, strings |

## 6. Native projects (only files changed from the RN scaffold matter)

| Path | Description |
|---|---|
| `android/build.gradle` | Forces NDK 27.1 for every Android library |
| `android/app/build.gradle` | `com.rnpdfparser` namespace / applicationId |
| `android/app/src/main/AndroidManifest.xml` | `INTERNET` only, `allowBackup=false`, data-extraction rules, debug-only cleartext placeholder |
| `android/app/src/main/res/xml/data_extraction_rules.xml` | Excludes all data from cloud backup and device transfer |
| `android/app/src/main/java/com/rnpdfparser/MainActivity.kt`, `MainApplication.kt` | RN entry (component `RnPdfParser`) |
| `ios/RnPdfParser/AppDelegate.swift` | RN entry (module `RnPdfParser`) |
| `ios/RnPdfParser/Info.plist` | Display name, ATS `NSAllowsLocalNetworking` (all builds, local addresses only — TDR-003), no permission strings |
| `ios/Podfile`, `RnPdfParser.xcodeproj`, `RnPdfParser.xcworkspace` | Target `RnPdfParser`, bundle id `com.rnpdfparser` |

## 7. Tests, E2E and tooling outside `src/`

| Path | Description |
|---|---|
| `jest/integration/mockServer.ts` | Spawns the unchanged mock (child process, temp state, random port); reset/scenario/state helpers |
| `jest/integration/createIntegrationModule.ts` | "Device" (repo + storage + picker) and `launchApp` (= process start) over real HTTP |
| `jest/integration/NodeFilePicker.ts`, `NodeFileStore.ts` | Real file system adapters for Node |
| `jest/integration/generateOversizeFixture.ts` | Runs the kit's `make-oversize.mjs` if needed |
| `jest/integration/waitFor.ts` | Deterministic polling wait |
| `jest/ui/setup.js` | Unistyles/safe-area/localize mocks, theme + i18n init |
| `jest/ui/renderApp.tsx` | Renders real screens over a fake-backed module |
| `.maestro/config.yaml` | Flow order |
| `.maestro/flows/01…05-*.yaml` | happy, lost_ack + relaunch, stale_status, delete_failure, spoofed + oversize |
| `.maestro/subflows/pick-fixture.yaml`, `mock.yaml` | System picker steps per platform; mock control |
| `.maestro/subflows/scroll-to.yaml`, `scroll-to-text.yaml`, `scroll-to-top.yaml` | Scroll to an element by id / text in either direction, or back to the top (small screens, large fonts) |
| `.maestro/scripts/mock.js` | Host-side reset/scenario/state for flows |
| `.maestro/scripts/push-fixtures-android.sh`, `push-fixtures-ios.sh` | Put fixtures where the system picker sees them |
| `scripts/android-emulator.sh` | Starts an emulator if none is connected (first AVD or `ANDROID_AVD`), waits for boot, `adb reverse` for the mock (`npm run android:emulator`, `android:dev`) |
| `scripts/make-archive.sh` | `npm run archive` — submission zip without installed/generated files |
| `scripts/maestro.sh` | Runs Maestro from `PATH` or `~/.maestro/bin` (used by `npm run e2e:*`) |
| `scripts/mock-control.mjs` | `npm run mock:state|reset|scenario` |
| `scripts/sanitize-test-report.mjs` | Makes report paths repo-relative |
| `mock-server/` | Candidate kit, **unchanged**: `mock-server.mjs`, its tests, `make-oversize.mjs`, `fixtures/` |

## 8. `docs/`

| Path | Description |
|---|---|
| `decisions.md` | Key decisions + intentional omissions |
| `architecture/rn-pdf-parser-statement-import-mobile-architecture.md` | Container architecture, diagrams |
| `architecture/adrs/`, `architecture/tdrs/` | ADR-001…003, TDR-001…006 |
| `test-results/` | Jest JSON report, summary + counters table, Maestro JUnit (when run) |
| `manual-test-guide.md` | Step-by-step manual test walkthrough (run → tap → expect) |
| `manual-test-checklist.md` | Short manual pass over the acceptance matrix |
| `project-structure.md` | This file |

---

## 9. Runtime flows (files in call order)

Abbreviations: `SI` = `src/features/statementImport`, `SH` = `src/shared`. Every use case is called through `SI/module.ts` (gate) from a hook.

### F1. App start
1. `index.js` → `src/app/theme/init.ts`, `src/app/i18n/i18n.ts`
2. `src/app/App.tsx` → `bootstrap/useAppModules.ts` → `bootstrap/createAppModules.ts`
3. `SI/adapters/importStore.ts` (`getOrCreateStorageEncryptionKey` → `MmkvImportStore`), `importApi.ts`, `filePicker.ts`, `fileStore.ts`, `SH/config/apiConfig.ts` (`API_BASE_URL`) → `SI/module.ts`
4. While loading → `SH/components/ScreenLoader`; failure → `bootstrap/BootFailure.tsx`; success → `SH/components/Toast` (`ToastProvider`) → `SI/ui/StatementImportContext.tsx`, `features/diagnostics/ui/DiagnosticsContext.tsx` → `navigation/RootNavigator.tsx` → `SI/ui/screens/ImportHomeScreen`
5. `SI/ui/hooks/useImportHomeScreen.ts` → `useCurrentImport.ts` + `useImportSession.ts` (**F5** recovery, polling **F6**; until the launch recovery answers an unconfirmed upload shows `SH/components/ScreenLoader` instead of the status); `ui/statusPresenter.toHomeMode` picks the panel; `statusPresenter.toStatusToast` turns a change of the saved import (accepted, ready, uncertain, failed, deleted, deletion not confirmed) into one toast

### F2. Pick and validate a file
1. `SI/ui/components/ImportEmptyState` → `useImportHomeScreen.handlePickFile` → `SI/useCases/selectFile.ts`
2. `SI/adapters/filePicker.ts` (pick, `keepLocalCopy`, move to our folder, `releaseAccess`)
3. `SI/adapters/fileStore.ts` (`size`, `readHead` → `SH/encoding/base64.ts`)
4. `SI/domain/validateFile.ts`
5. Valid: `domain/statementImport.createDraft` + `SH/ids/generateKey.ts` → `adapters/importStore.save` → UI shows `ConfirmFilePanel`
6. Invalid: `fileStore.remove` → error code → `ui/statusPresenter.toErrorMessageCode` → i18n message in an error toast (no network call)

### F3. Confirm or cancel
- `SI/ui/components/ConfirmFilePanel` → `ui/hooks/useConfirmFilePanel.ts` (size via `SH/format/fileSize.ts`)
- Cancel / Android back → `useCases/discardImport.ts` (`'currentImport'`) → copy removed → store cleared → empty state
- Upload → **F4**

### F4. Upload (submit)
1. `useConfirmFilePanel.handleConfirm` (or "Retry upload" in `useImportStatusPanel`) → `useCases/submitImport.ts`
2. `store.save(markSubmitting)` **before** the request
3. `fileStore.readAll` → `adapters/importApi.ts` `createImport` (ASCII `X-File-Name`, `SH/net/fetchWithTimeout.ts`, Zod parsing)
4. 202 → `domain applySnapshot` → copy removed → `submitted` (queued, rev 1) → **F6**
5. No response / 5xx → `markSubmitUncertain` (copy kept) → **F5**
6. 400/409/413/415 → `markFailed`, copy removed → "Import failed" + Start new (**F9**)

### F5. Recover an unknown outcome (lost ack, kill, relaunch)
1. Trigger: launch / foreground (`ui/hooks/useImportSession.ts`) or "Check again" (`useImportStatusPanel.ts`)
2. `useCases/recoverImport.ts`: orphan copies removed (`fileStore.listPrivateCopies`) first
3. `submitting` / `submitUncertain` → `importApi.findImportByKey` → found: `applySnapshot`, copy removed → **F6**; 404: stays uncertain, hint "not found yet" → user may "Retry upload" (**F4**, same key)
4. Known job → `importApi.getImport` → `refreshJob.applyJobResponse`; interrupted delete → `markDeletionNotConfirmed` (**F8**)
5. Never calls `createImport`

### F6. Status tracking, polling, stale responses
1. `SI/ui/components/ImportStatusPanel` → `ui/hooks/useImportStatusPanel.ts` → `ui/statusPresenter.ts` (status, tone, actions)
2. Pending (queued / processing / deleting) → `ui/hooks/useImportSession.ts` polling (`setInterval` 1 s, stopped in background)
3. Also on screen focus and "Refresh" → `useCases/refreshJob.ts` → `importApi.getImport` → `applySnapshot` (older/equal revision ignored → stale_status can't roll back)
4. `store.save` → `module.currentImport` listeners → `useCurrentImport` re-render (`StatusSummary` shows job id + revision)

### F7. Report and details
1. Ready → `ImportStatusPanel` → `ReportCard` → `ChargeRow` (`SH/format/formatMoney.ts`, `formatDate.ts`); total via `domain/statementImport.monthlyTotalMinor`
2. "Details" → `ui/screens/ChargeDetailsScreen` → `useChargeDetailsScreen.ts` (reads the persisted report; no actions)

### F8. Delete
1. "Delete import" / "Retry deletion" → `useImportStatusPanel.handleDelete` → `useCases/requestDeletion.ts`
2. `domain requestDeletion` (stable delete key) → `store.save` **before** DELETE
3. `importApi.deleteImport` → 202 `deleting` → `applySnapshot` (deletion accepted) → polling (**F6**) until `deleted` → "Deleted on the server"
4. Error (e.g. 503) → `markDeletionNotConfirmed` → warning banner + warning toast + "Retry deletion" (same key)
5. Late non-deletion responses are ignored by `applySnapshot`

### F9. Start a new import
- Failed or deleted → "Start a new import" → `useCases/discardImport.ts` (`'currentImport'`) → store cleared → empty state (**F2**)

### F10. Clear local data
- `ui/components/ClearLocalDataSection` → `useImportHomeScreen.handleClearLocalData` → `useCases/discardImport.ts` (`'allLocalData'`) → `fileStore.listPrivateCopies` + `remove` → store cleared (server data untouched)

### F11. Orphan copy sweep
- First step of every `useCases/recoverImport.ts` run → copies in our folder not referenced by the persisted import are removed. The picker's staging folder and the iOS temp copy are removed by `adapters/filePicker.ts` right away

### F12. Diagnostics (dev builds)
- `app/navigation/DiagnosticsHeaderButton.tsx` → `features/diagnostics/ui/screens/DiagnosticsScreen` → `ui/hooks/useDiagnosticsScreen.ts` → `adapters/HttpMockControlClient.ts` (`/__test/state`, `/__test/scenario`, `/__test/reset`); address from `SH/config/apiConfig.ts` (same as `HttpImportApi`)

## 10. Test flows

| Flow | Files |
|---|---|
| Unit (`npm run test:unit`) | `SI/domain/__tests__/*`, `SI/useCases/__tests__/*` (+ `support/*` fakes and `createTestModule.ts`), `SI/adapters/__tests__/*.unit.test.ts`, `SI/ui/__tests__/*.unit.test.ts`, `SH/**/__tests__/*` |
| Integration (`npm run test:integration`) | `SI/adapters/__tests__/acceptanceMatrix.integration.test.ts` → `jest/integration/mockServer.ts` (spawns `mock-server/mock-server.mjs`) → `createIntegrationModule.ts` (`NodeFilePicker.ts`, `NodeFileStore.ts`, real `HttpImportApi`) → `generateOversizeFixture.ts`, `waitFor.ts` |
| UI (`npm run test:ui`) | `SI/ui/__tests__/ImportFlow.ui.test.tsx`, `SH/components/__tests__/feedback.ui.test.tsx` → `jest/ui/setup.js`, `jest/ui/renderApp.tsx` → real screens/hooks/presenters over `createTestModule.ts` fakes |
| Report (`npm run test:report`) | Jest JSON → `scripts/sanitize-test-report.mjs` → `docs/test-results/jest-results.json` |
| E2E (`npm run e2e:<platform>`) | `.maestro/scripts/push-fixtures-*.sh` → `scripts/maestro.sh` → `.maestro/config.yaml` → `flows/*.yaml` → `subflows/pick-fixture.yaml`, `subflows/mock.yaml`, `subflows/scroll-to*.yaml` (incl. `scroll-to-top.yaml`) → `.maestro/scripts/mock.js` (host HTTP to the mock) |
| Mock kit (`npm run mock:test`) | `mock-server/mock-server.test.mjs` |
