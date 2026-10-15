# ADR-002: Idempotent upload, recovery by key, revision guard

- **Status:** Accepted
- **Date:** 2026-10-14
- **Authors:** Gleb (with AI assistance — see `SELF_REVIEW.md`)
- **Deciders:** Gleb

---

## Context

POST may create a job and lose its response; the app may be killed at any point; GET may return an older revision; DELETE may fail. A second job, a resurrected deleted job or a false deletion claim are stop-factors.

## Decision

The idempotency key is generated when the file is accepted and persisted (with the private copy path) before the first POST; the `submitting` phase is persisted before sending. Unknown outcomes become `submitUncertain`. On launch/foreground the app only reads (`GET /imports/by-key/{key}` or `GET /imports/{id}`) and never re-sends; re-sending with the same key and bytes happens only on an explicit 'Retry upload'. Every server response passes `applySnapshot`: older/equal revisions, other jobs and any non-deletion status after deleting/deleted are ignored. Deletion persists a stable delete key first and is shown as done only after `GET → deleted`.

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Auto re-POST on relaunch | Violates 'no spontaneous resend'; would hide the uncertain state from the user. |
| New key per retry | Creates a second job after a lost acknowledgement. |
| Trust the latest response | stale_status would roll the UI back to processing. |

## Consequences

### Positive
- Exactly one job per selected file, proven by mock counters in integration tests.
- Relaunch at any point lands on a consistent, truthful state.

### Negative / Trade-offs
- The private copy must be kept until the job is known (needed for a same-key retry).
- If the mock loses state, a known job turns into IMPORT_NOT_FOUND (shown, not hidden).

### Risks
- A server that doesn't honour idempotency keys would still be protected only by the by-key lookup.

---

## References

- `docs/decisions.md`
- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
