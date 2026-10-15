# TDR-002: No OpenTelemetry / crash reporting

- **Status:** Accepted
- **Severity:** Medium
- **Debt Type:** Infrastructure
- **Date:** 2026-10-14
- **Reporter:** Gleb
- **Owner:** Gleb

---

## Context

Standards require the OpenTelemetry mobile SDK with errors as span events. The task forbids sending statement data to analytics/crash logs and has no collector; only dev-build JSON console logs with allow-listed fields exist.

## Impact

Production failures (OOM on upload, picker errors per OEM, decrypt failures) would be invisible.

### Indicators
- Unknown crash-free rate
- Import error rate by code per OS not measurable

## Remediation Plan

Add the OpenTelemetry RN SDK exporting to a self-hosted collector; emit only the allow-listed `ILogger` fields; add metrics: import error rate by `error.code`, `newJobs`-per-key anomalies, delete-confirmation latency.

## Effort & Scheduling

- **Effort estimate:** M
- **Target resolution:** none
- **Blocking:** nothing currently

---

## References

- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
- `docs/decisions.md`
