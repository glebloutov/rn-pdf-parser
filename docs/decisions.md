# Decisions

The decisions that shape `rn-pdf-parser` and why. Architecture details: `docs/architecture/` (ADRs, TDRs).

## Key decisions

| # | Decision | Why |
|---|---|---|
| D1 | **Simplified hexagonal + TDD**: pure `domain/`, all external dependencies behind `ports.ts`, one use case per scenario in `useCases/`, `module.ts` wires them; device adapters in `app/bootstrap` (ADR-001) | Graded on behaviour under failure → rules live in pure, testable code; one scenario = one file is easy to review |
| D2 | **Idempotency key persisted before the POST**; no automatic re-send after relaunch — recovery only reads (by key / by id); "Retry upload" reuses the same key (ADR-002) | Lost acknowledgement and relaunch must never create a second job |
| D3 | **Persisted import = single source of truth.** Every server answer passes the `applySnapshot` revision guard (older, equal, other-job and "resurrecting" answers are ignored); dev builds show the ignored answers under the job line | `stale_status` and late answers can't roll the screen back; "Deleted" only after the server confirms |
| D4 | **One operation at a time** (gate in `module.ts`); a refused launch recovery is retried | A double tap, a poll racing a DELETE or recovery racing a submit can't send a second request |
| D5 | **Encrypted local state**: MMKV (AES-256), key in Keychain/Keystore; private file copy under a neutral `<uuid>.bin` name, removed as soon as it isn't needed; no Android backup (ADR-003) | The statement is personal financial data |
| D6 | **Client validation mirrors the server byte-for-byte** (`%PDF-` / CSV header, ≤ 10 MiB) before anything is sent; extension and MIME are never trusted | The client never sends what the server would reject; spoofed / oversize files never leave the device |
| D7 | **Zod validates every untrusted input**: API answers, the persisted state, `/__test/state`, the `.env` address | Validation at the boundary; a broken or old stored state can't crash the app |
| D8 | **Mock address from `.env`** (`MOCK_API_URL`, default `http://127.0.0.1:8787`); Diagnostics screen (scenario switch, counters) in dev builds only | Reviewer switches scenarios without code changes; physical devices work without editing sources |
| D9 | **Toasts for events, banners for states**: an action's result (file rejected, request failed, upload accepted, report ready, deletion confirmed / not confirmed) is a toast; the import status and "deletion not confirmed" stay on screen. Loading: a spinner in the pressed button, or a centred loader for app start, first Diagnostics load and the relaunch lookup of an unconfirmed upload | Events don't move the layout and are seen even when the result is above the fold; states must not disappear; no "Upload result unknown" flash after a relaunch |
| D10 | **Tests against the real, unchanged mock**: Jest `unit` / `integration` (spawns the kit, asserts its counters) / `ui` (RNTL); Maestro E2E for all five scenarios on both platforms | Acceptance criteria are mock counters; the kit must stay unchanged |

## Intentional omissions

Deliberately not done — trade-offs for the test-task scope (behaviour under failure first), not something forgotten. Production follow-ups are TDRs in `docs/architecture/tdrs/`.

| Not done | Why | Where |
|---|---|---|
| More than one import at a time | The scenario covers one statement; a list adds multi-job state and UI without testing anything new | TDR-004 |
| Native streaming upload | The file is validated ≤ 10 MiB before reading; one JS HTTP adapter stays testable in Node against the real mock | TDR-005 |
| Backoff / `Retry-After` in polling | A fixed 1 s interval is enough for a local mock whose jobs finish in ~1 s; polling pauses in background | TDR-006 |
| Crash reporting / analytics / OpenTelemetry | No collector, and the task forbids sending file data to analytics or crash logs; dev-only allow-listed logs instead | TDR-002 |
| Certificate pinning, TLS, task-switcher blur | The only backend is a local HTTP mock with synthetic data; Android release builds forbid cleartext, iOS allows only local addresses | TDR-003 |
| pnpm + `.mise.toml` | npm keeps the clean checkout on the default toolchain | TDR-001 |
| TanStack Query, react-hook-form, Reanimated, FlashList | The persisted import is the single source of truth (a query cache would be a second one); polling is a plain `setInterval`; no forms; no animations needed; the report has two items | D3 |
| Offline queue / background upload | The task asks for recovery after a lost answer and relaunch, not offline work; requests fail visibly and are recovered on launch / foreground | D2 |
| OTA updates | Every change ships through a store build; the JS/binary boundary is still documented | `RELEASE_NOTES.md` |
| Real PDF parsing, auth, payments, cancel-subscription action | Out of scope: the report is the mock's answer; the details card is read-only on purpose | Assignment |
| Diagnostics in release builds | Reviewer / developer tool only | D8 |
| Physical devices | Simulators and emulators only (incl. small screens and large fonts) | `README.md` |
