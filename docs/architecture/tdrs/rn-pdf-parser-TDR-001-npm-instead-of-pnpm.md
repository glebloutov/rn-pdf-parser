# TDR-001: npm instead of pnpm + mise

- **Status:** Accepted
- **Severity:** Low
- **Debt Type:** Dependency
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

Standards require pnpm and a `.mise.toml` pinning Node, pnpm, Ruby and JDK. Gleb chose npm (the one bundled with Node; `engines` allows `^22.13` / `^24.3` / `≥ 26`) and an optional `.nvmrc` (Node 26) to keep the reviewer's clean checkout on the default toolchain.

## Impact

Toolchain versions other than Node (Ruby/CocoaPods, JDK) are not pinned by the repo; reviewers may hit environment drift.

### Indicators
- CocoaPods/JDK version errors on a clean checkout

## Remediation Plan

Switch to pnpm with a committed `pnpm-lock.yaml` and add `.mise.toml` pinning Node 26, pnpm, Ruby and JDK 17.

## Effort & Scheduling

- **Effort estimate:** S
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
