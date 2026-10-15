# TDR-005: Upload reads the file into JS memory

- **Status:** Accepted
- **Severity:** Medium
- **Debt Type:** Code
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

The validated file (≤ 10 MiB) is read as base64, decoded to bytes and passed to `fetch`, transiently ~3× the file size in memory. This keeps one HTTP adapter that is tested in Node against the real mock.

## Impact

Possible memory pressure on low-end Android near the 10 MiB limit.

### Indicators
- OOM/crash reports during upload
- Slow upload on older devices

## Remediation Plan

Stream the upload natively from the private copy (e.g. a native upload API or a file-body fetch) and keep the JS adapter for tests.

## Effort & Scheduling

- **Effort estimate:** M
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
