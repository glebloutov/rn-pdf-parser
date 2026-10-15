# rn-pdf-parser — statement import without losing state

React Native (bare, New Architecture) client for the Mobile Engineer test task: pick a synthetic statement (PDF/CSV), validate it on the device, upload its real bytes to the local mock with a persisted idempotency key, follow the asynchronous job, survive a lost acknowledgement and relaunches, and delete the import safely.

- Assignment: the Mobile Engineer test task (PDF handed out with the candidate kit; not included in this repository)
- Mock server + fixtures (unchanged candidate kit): `mock-server/`
- Key decisions and intentional omissions: [docs/decisions.md](docs/decisions.md)
- Architecture + ADRs/TDRs: [docs/architecture/](docs/architecture/)
- Every folder/file and every flow with the files it touches: [docs/project-structure.md](docs/project-structure.md)
- **Step-by-step manual test guide (run → tap → expect):** [docs/manual-test-guide.md](docs/manual-test-guide.md)
- Release note: [RELEASE_NOTES.md](RELEASE_NOTES.md) · Self-review: [SELF_REVIEW.md](SELF_REVIEW.md) · Test results: [docs/test-results/](docs/test-results/)



## Requirements


| Tool        | Version                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------------------------- |
| Node.js     | `^22.13` / `^24.3` / `≥ 26` (React Native 0.87 requirement); developed and tested on 26.11.1. The mock kit needs ≥ 20 |
| npm         | the npm bundled with those Node versions (tested with 11 and 12.2.0)                                                  |
| Xcode       | 26.6 (iOS deployment target 15.1)                                                                                     |
| CocoaPods   | 1.16.2 (via `bundle exec`)                                                                                            |
| JDK         | 17                                                                                                                    |
| Android SDK | compileSdk 37, targetSdk 36, minSdk 24, NDK 27.1.12297006                                                             |
| Maestro CLI | 2.11.0 (E2E only)                                                                                                     |




## Project layout

```
src/app/                    composition root (+ device adapters wiring), navigation, i18n (EN/RU), theme
src/shared/                 Result, logger, theme, config (.env address), ids, UI components, formatting
src/features/statementImport/
  domain/ ports.ts useCases/ module.ts adapters/ ui/ i18n/   (simplified hexagonal, see ADR-001)
src/features/diagnostics/   mock scenario switch + counters (dev only): ports.ts adapters/ ui/
jest/                       real-mock integration harness, UI harness
.maestro/                   E2E flows + fixture scripts
mock-server/                candidate kit, unchanged
scripts/                    archive, Android emulator, Maestro wrapper, mock control, test-report helpers
docs/                       architecture (ADR/TDR), decisions, structure & flows, test guide, test results
```

Full map of every file and flow: [docs/project-structure.md](docs/project-structure.md).

## Clean checkout

The repository contains sources, docs, the unchanged mock kit and lock files — no `node_modules`, Pods, build outputs, `.env` or generated fixtures, so every step below is needed.

```sh
git clone https://github.com/glebloutov/rn-pdf-parser.git
cd rn-pdf-parser
node -v                         # must be ^22.13, ^24.3 or ≥ 26 (developed on 26)
npm ci                          # app dependencies, exact versions from package-lock.json
npm run mock:oversize           # creates mock-server/fixtures/oversize.csv (> 10 MiB, not in the repository)
npm run pods                    # iOS only: bundle install + pod install
```

Node can be installed any way you like. Optional: with nvm, `nvm install && nvm use` picks Node 26 from `.nvmrc`.

Quick check that the checkout is complete (no device needed):

```sh
npm run typecheck && npm run lint && npm test   # 149 Jest tests incl. the acceptance matrix against the real mock
npm run mock:test                                # the kit's own tests
```

The mock kit needs no install (`mock-server/` has no dependencies). No `.env` is needed for simulators/emulators (see **Run → Step 0**).


## Run

**Step 0 (optional) — mock address.** Skip it for the iOS Simulator and for an Android emulator started with `npm run android:dev` / `android:emulator`: the default `http://127.0.0.1:8787` works (those scripts forward the port; `npm run android:reverse` does only the forwarding). Only for a physical device or an emulator without port forwarding, create `.env` **before starting Metro** — the value is baked into the JS bundle when Metro builds it:

```sh
cp .env.example .env
# Physical device: MOCK_API_URL=http://<your computer's LAN IP>:8787  and start the mock with  HOST=0.0.0.0 npm run mock
# Android emulator without adb reverse: MOCK_API_URL=http://10.0.2.2:8787
```

An invalid value falls back to the default; the address in use is shown on the **Diagnostics** screen. If Metro was already running, restart it with `npm start -- --reset-cache`. Don't expose the mock to the internet.

Terminal 1 — mock API (`http://127.0.0.1:8787`):

```sh
npm run mock
```

Terminal 2 — Metro:

```sh
npm start
# after changing .env or babel.config.js: npm start -- --reset-cache
```

Terminal 3 — app:

```sh
npm run ios                     # iOS Simulator reaches 127.0.0.1 directly

npm run android:dev             # starts an emulator if none is connected (no Android Studio needed),
                                # waits for boot, forwards the mock port, then builds and runs the app
# or step by step:
npm run android:emulator        # emulator + adb reverse tcp:8787 (ANDROID_AVD=<name> to pick one)
npm run android                 # build + install + run
```



## Switching mock scenarios (no code changes)

- In the app: **Diagnostics** screen → `happy` / `lost_ack` / `stale_status` / `delete_failure`, live counters, reset.
- From a terminal:

```sh
npm run mock:scenario -- lost_ack     # happy | lost_ack | stale_status | delete_failure
npm run mock:state                    # mode, stats (createRequests, newJobs, duplicateHits, …), jobs
npm run mock:reset
```



## Tests

```sh
npm run typecheck        # app (tsconfig.json) + tests (tsconfig.test.json)
npm run lint
npm test                 # all Jest projects
npm run test:unit        # domain, use cases (fakes), presenters, adapters
npm run test:integration # HTTP client + use cases against the REAL unchanged mock (spawned per suite, temp state)
npm run test:ui          # screens via React Native Testing Library
npm run test:report      # writes docs/test-results/jest-results.json
npm run mock:test        # the kit's own tests
```

The integration suite runs the full acceptance matrix against the real mock and asserts its counters — see [docs/test-results/README.md](docs/test-results/README.md).

### E2E (Maestro)

Install Maestro 2.11.0: `curl -fsSL https://get.maestro.mobile.dev | bash` (the npm scripts find it in `~/.maestro/bin`). Flows expect the device language **English**, the mock running and the debug app installed.

```sh
npm run e2e:android                                   # pushes fixtures itself; JUnit → docs/test-results/maestro-android.xml
npm run e2e:fixtures:ios && npm run e2e:ios           # open the Files app once first; → maestro-ios.xml
```

Several devices running: pick one with `IOS_UDID=<udid>` / `ANDROID_SERIAL=<serial>` for the fixture scripts and `sh scripts/maestro.sh --udid <id> test …` for the run; run suites one after another (they share the mock). The system file picker steps are verified on iOS 26.5 and Android 14; other OS versions may need changes in `.maestro/subflows/pick-fixture.yaml`.

## Acceptance matrix — how to check manually

Full click-by-click version with expected texts and counters: [docs/manual-test-guide.md](docs/manual-test-guide.md).


| Scenario           | Steps                                                                        | Expected                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| happy              | Pick `statement.csv` → confirm                                               | "Queued" (not a report) → "Ready", StreamBeam + BrightGrid, total A$151.99 / month; Diagnostics `newJobs = 1`       |
| lost_ack           | Diagnostics → `lost_ack`; pick + confirm; kill and relaunch the app          | "Upload result unknown", then after relaunch the real job; `newJobs = 1`, `createRequests = 1`                      |
| stale_status       | Reach "Ready"; Diagnostics → `stale_status`; back; tap "Refresh" a few times | Stays "Ready", revision 3; "Ignored outdated server answers: 1 (last: processing · revision 2)" appears (dev build) |
| delete_failure     | Reach "Ready"; Diagnostics → `delete_failure`; "Delete import"               | "Deletion was not confirmed…"; switch to `happy`; "Retry deletion" → "Deleted on the server"                        |
| spoofed + oversize | Pick `spoofed.pdf`, then `oversize.csv`                                      | Both rejected on the device; `createRequests` unchanged                                                             |


Fixtures for manual picking: Android `npm run e2e:fixtures:android`; iOS Simulator `npm run e2e:fixtures:ios` (or drag the files from `mock-server/fixtures/` onto the simulator and save them to Files).

## Results per platform

Only what was actually run is marked as working. Fill in device/OS and results after each verification run.

### iOS


| Item               | Value                   |
| ------------------ | ----------------------- |
| Device / simulator | iPhone 17 Pro simulator |
| iOS version        | 26.5                    |
| Date               | 2026-10-15              |



| Scenario                               | Result                                                                                                                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch                                 | Passed (Maestro + manual)                                                                                                                                                                                                                                      |
| File picker                            | Passed (Maestro + manual, Files › On My iPhone)                                                                                                                                                                                                                |
| happy (full import)                    | Passed (Maestro + manual; `01-happy`: queued → ready, 2 charges, details, delete → deleted, `newJobs = 1`)                                                                                                                                                     |
| lost_ack + relaunch                    | Passed (Maestro + manual; `02`: uncertain → kill/relaunch → recovered, `newJobs = 1`, `createRequests = 1`)                                                                                                                                                    |
| stale_status                           | Passed (Maestro + manual; `03`: stays Ready, revision 3)                                                                                                                                                                                                       |
| delete_failure                         | Passed (Maestro + manual; `04`: not confirmed → retry → deleted, `deleteRequests = 2`)                                                                                                                                                                         |
| spoofed + oversize                     | Passed (Maestro + manual; `05`: both rejected, `createRequests = 0`)                                                                                                                                                                                           |
| Original files untouched after picking | Passed (checked in the simulator's Files storage after the run)                                                                                                                                                                                                |
| Large font                             | Passed: largest accessibility size (AX5) — every screen readable, actions reachable by scrolling, text capped at 2×; checked with screenshots, because Maestro can't pick a file in the system Files picker at that size                                       |
| Small screen                           | Passed: iPhone SE (3rd generation), `iPhone SE small`, iOS 26.5, 375×667 pt, standard text size; Maestro 5 / 5 — [maestro-ios-small.xml](docs/test-results/maestro-ios-small.xml). All four fixture originals still match their SHA-256 hashes after the run |
| Maestro flows                          | 5 / 5 passed — `docs/test-results/maestro-ios.xml`                                                                                                                                                                                                             |
| Physical device                        | Not verified                                                                                                                                                                                                                                                   |




### Android


| Item              | Value                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| Device / emulator | Android emulator `Pixel_3a_API_34_extension_level_7_arm64-v8a` (sdk_gphone64_arm64) |
| Android version   | 14 (API 34)                                                                         |
| Date              | 2026-10-15                                                                          |



| Scenario            | Result                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Launch              | Passed (Maestro + manual)                                                                                                                                                      |
| File picker         | Passed (Maestro + manual, DocumentsUI › Downloads)                                                                                                                             |
| happy (full import) | Passed (Maestro + manual)                                                                                                                                                      |
| lost_ack + relaunch | Passed (Maestro + manual)                                                                                                                                                      |
| stale_status        | Passed (Maestro + manual)                                                                                                                                                      |
| delete_failure      | Passed (Maestro + manual)                                                                                                                                                      |
| spoofed + oversize  | Passed (Maestro + manual)                                                                                                                                                      |
| Large font          | Passed: Maestro 5 / 5 at system font 2× on a 360×640 dp screen (Pixel 3a with `wm size 720x1280`, `wm density 320`, `font_scale 2.0`)                                          |
| Small screen        | Passed: emulator `Small_Phone_API_34`, 720×1280 @ 320 dpi (360×640 dp), Android 14; Maestro 5 / 5 — [maestro-android-small.xml](docs/test-results/maestro-android-small.xml) |
| Maestro flows       | 5 / 5 passed — `docs/test-results/maestro-android.xml`                                                                                                                         |




### Automated (no device)


| Suite                                    | Result (2026-10-15, macOS 26.5.2)                                   |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Typecheck, ESLint                        | Pass                                                                |
| Jest unit + integration (real mock) + UI | 149 / 149 passed, 21 suites (Node 22.20.0; regenerated JSON report) |
| Mock kit tests                           | 6 / 6 passed                                                        |
| Metro bundles (iOS, Android)             | Build without errors                                                |


