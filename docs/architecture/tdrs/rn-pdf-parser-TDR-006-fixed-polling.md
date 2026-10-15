# TDR-006: Fixed polling interval

- **Status:** Accepted
- **Severity:** Low
- **Debt Type:** Design
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

Job status is polled every second while pending (paused in background), plus refresh on focus/foreground/button. No backoff, no `Retry-After` handling.

## Impact

Unnecessary load and battery use at scale; standards require exponential backoff on transient errors and respecting `Retry-After`.

### Indicators
- Server request rate per job
- Battery complaints

## Remediation Plan

Exponential backoff with jitter, honour `Retry-After`, or switch to push/websocket notifications for job completion.

## Effort & Scheduling

- **Effort estimate:** S
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
