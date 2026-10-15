# TDR-003: No certificate pinning, cleartext to the local mock, no task-switcher blur

- **Status:** Accepted
- **Severity:** Medium
- **Debt Type:** Design
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

The only backend is a local HTTP mock (`127.0.0.1:8787`). Android allows cleartext in debug builds only (manifest placeholder). iOS sets `NSAllowsLocalNetworking` in the shared `Info.plist`, so release builds also allow plain HTTP to local addresses (ATS stays on for everything else); it should move to a Debug-only plist before a real release. Pinning a local mock is meaningless; synthetic data makes screen blur low value.

## Impact

A real deployment would need TLS + pinning and screen protection for financial data.

### Indicators
- Any non-local HTTP endpoint in a release build

## Remediation Plan

Introduce an HTTPS API host per environment, move iOS `NSAllowsLocalNetworking` to a Debug-only `Info.plist`, certificate pinning, `FLAG_SECURE` on report screens and blur-on-background on iOS.

## Effort & Scheduling

- **Effort estimate:** M
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
