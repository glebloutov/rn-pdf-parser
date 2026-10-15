# Test results

Generated with `npm run test:report` (raw: `jest-results.json`, paths made repo-relative). Maestro JUnit reports land here as `maestro-android.xml` / `maestro-ios.xml` when `npm run e2e:<platform>` is run.

## Last automated run

| Date | Environment | Result |
|---|---|---|
| 2026-10-15 | macOS 26.5.2, Node 22.20.0, Jest 29 | 21 suites, **149 / 149 passed** |
| 2026-10-15 | Mock kit (`npm run mock:test`) | 6 / 6 passed |
| 2026-10-15 | Maestro iOS — iPhone 17 Pro simulator, iOS 26.5 (`maestro-ios.xml`) | **5 / 5 flows passed** |
| 2026-10-15 | Maestro iOS small — iPhone SE (3rd generation), iOS 26.5, 375×667 pt, standard text size (`maestro-ios-small.xml`) | **5 / 5 flows passed** |
| 2026-10-15 | Maestro Android — Pixel 3a API 34 emulator, Android 14 (`maestro-android.xml`) | **5 / 5 flows passed** |
| 2026-10-15 | Maestro Android small — `Small_Phone_API_34`, 720×1280 @ 320 dpi (360×640 dp), Android 14 (`maestro-android-small.xml`) | **5 / 5 flows passed** |
| 2026-10-15 | Maestro Android — 360×640 dp + system font 2× (Pixel 3a with `wm size` / `font_scale`) | **5 / 5 flows passed** (no report file) |

| Project | Suites | Focus |
|---|---|---|
| unit | 18 (118 tests) | Validator (fixtures, 10 MiB edge, CRLF/BOM parity), aggregate revision guard, use cases with fakes (key persisted before POST, lost ack, relaunch, delete 503 + key reuse, copy cleanup), presenters, adapters |
| integration | 1 (13 tests) | Use cases + `HttpImportApi` against the real unchanged mock, isolated state per run |
| ui | 2 (18 tests) | Screens and feedback with React Native Testing Library: truthful states, stale UI, deletion wording, details card, font scaling, toasts and loaders |

## Acceptance matrix vs mock counters (integration suite, real mock)

Each test starts with `POST /__test/reset`, so counters are reproducible.

| Scenario | Asserted app state | Asserted mock counters (`GET /__test/state`) |
|---|---|---|
| happy | 202 → `queued` rev 1 (no report); later `ready`, 2 items, 15199 minor AUD | `newJobs = 1`; job `sha256` = SHA-256 of the fixture (real bytes sent) |
| happy (PDF, Cyrillic name) | `statement.pdf` reaches ready; `выписка.csv` accepted | — |
| lost_ack | `submitUncertain`, copy kept | `newJobs = 1` |
| lost_ack + relaunch | new app instance recovers `job-demo-001` by key | `createRequests = 1`, `newJobs = 1` |
| lost_ack + explicit retry | same job id | `newJobs = 1`, `duplicateHits = 1` |
| relaunch after ready | still `ready`, nothing re-sent | `createRequests = 1` |
| stale_status | ready rev 3, then processing rev 2 ignored → stays ready rev 3 | — |
| delete_failure | 503 → deletion `notConfirmed`, local status `ready` | server job status `ready` |
| delete_failure → happy | retry with the same delete key → `deleted` | `deleteRequests = 2`, server status `deleted` |
| spoofed + oversize | rejected (`UNSUPPORTED_CONTENT`, `FILE_TOO_LARGE`), no copies left | `createRequests = 0` before and after |

## Device runs

See the per-platform tables in the root `README.md`. Not verified there = not verified.
