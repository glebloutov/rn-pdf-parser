# ADR-001: Simplified hexagonal feature layout with TDD

- **Status:** Accepted
- **Date:** 2026-10-14
- **Authors:** Gleb (with AI assistance — see `SELF_REVIEW.md`)
- **Deciders:** Gleb

---

## Context

The task is graded mostly on behaviour under failure (lost acknowledgement, relaunch, stale revisions, failed deletion). Those rules must be testable without devices, a UI or timing tricks, and the same rules must apply to every server response.

## Decision

The statement-import feature uses a simplified hexagonal layout: `domain/` (pure aggregate + rules), `ports.ts` (every external dependency as an interface), `useCases/` (one function per scenario), `module.ts` (composition + a gate: one operation at a time), `adapters/` (HTTP, picker, file system, encrypted MMKV + Keychain) and `ui/` (screens, components, hooks as inbound adapters, pure presenter). Device adapters are wired in `app/bootstrap`. Work is test-first: domain → use cases with fakes → integration tests against the real unmodified mock → UI tests with React Native Testing Library → Maestro flows. The diagnostics feature uses the same `ports.ts` / `adapters/` / `ui/` layout in the simple tier (hook → port, no use cases).

### History — revision 2026-10-15 (from canonical to simplified hexagonal)

Kept: pure domain rules, ports for everything outside the app, one use case per scenario, a single gate, the same tests. Removed ceremony: use-case classes → functions `(deps) => Promise<Result>`; four port files + deps + errors → one `ports.ts`; `application/`, `infrastructure/`, `config/` → `useCases/`, `adapters/` (4 files), `module.ts`; `OperationGate` class / `CurrentImportQuery` / `applyJobResponse` module → inside `module.ts` / `refreshJob.ts`; device wiring → `app/bootstrap`. Deviation from the team standards' canonical hexagonal naming (`*UseCase` classes, `application/` + `infrastructure/` folders) is deliberate: navigation is "one scenario = one file".

## Alternatives Considered

| Option | Reason rejected |
|---|---|
| Screens/hooks calling `fetch` directly | Failure rules would be spread over components and only testable through the UI. |
| Redux/Zustand store with thunks | Not allowed by the standards; adds a second state model next to the persisted aggregate. |
| Full hexagonal for diagnostics too | No business rules there — YAGNI per the tiered approach. |
| Canonical hexagonal (use-case classes, `application/` + `infrastructure/` + `config/`, one file per port) | Used first; the user decided it was too much ceremony for one feature — navigation was harder without adding safety (see History). |

## Consequences

### Positive
- Every acceptance-matrix rule has a fast unit test and an integration test against the real mock.
- UI only renders a presenter view model, so 'truthful states' are unit-tested.

### Negative / Trade-offs
- More files than a typical small RN app (ports, module, adapters).
- Naming deviates from the canonical hexagonal layout of the team standards (documented here).

### Risks
- Over-engineering perception by reviewers — mitigated by keeping only the layers the feature needs.

---

## References

- `docs/decisions.md`
- `docs/architecture/rn-pdf-parser-statement-import-mobile-architecture.md`
