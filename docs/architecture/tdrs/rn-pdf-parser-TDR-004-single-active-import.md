# TDR-004: Single active import

- **Status:** Accepted
- **Severity:** Low
- **Debt Type:** Design
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

The scenario covers one statement at a time; the aggregate and UI hold exactly one import.

## Impact

Users can't queue several statements; a new import requires finishing or deleting the current one.

### Indicators
- Feature request for multiple statements

## Remediation Plan

Persist a list of imports keyed by idempotency key; one gate per import; list screen.

## Effort & Scheduling

- **Effort estimate:** M
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
