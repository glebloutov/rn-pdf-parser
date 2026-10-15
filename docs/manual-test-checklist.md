# Quick manual checklist

A short pass over the acceptance matrix; detailed steps and expected texts: [`manual-test-guide.md`](manual-test-guide.md).

Before each platform: `npm run mock:reset`, app freshly launched, device language English (or Russian — the UI is bilingual). Open the Diagnostics screen (scenario + counters) at the key moments.

1. **happy** — pick `statement.csv` → confirm screen (name, size, format) → upload → "Queued" (not a report) → "Ready" → StreamBeam + BrightGrid, total A$151.99 / month → "Details" card (no cancel action) → Diagnostics: `newJobs = 1`.
2. **lost_ack / relaunch** — Diagnostics → `lost_ack` → pick + upload → "Upload result unknown" → kill the app → relaunch → a centred loader, then the real job → Diagnostics: still `newJobs = 1`, `createRequests = 1`.
3. **stale_status** — reach "Ready" → Diagnostics → `stale_status` → back → tap "Refresh" 2–3× → stays "Ready", revision 3, and "Ignored outdated server answers: 1 (last: processing · revision 2)" appears.
4. **delete_failure** — reach "Ready" → Diagnostics → `delete_failure` → "Delete import" → "Deletion was not confirmed…" (no "deleted") → Diagnostics → `happy` → "Retry deletion" → "Deleted on the server".
5. **spoofed + oversize** — note `createRequests` → pick `spoofed.pdf` (rejected, red toast) → pick `oversize.csv` (rejected, red toast) → `createRequests` unchanged.
6. Optional: large system font and a small device (iPhone SE / small Android); toasts on each event; "Clear local data".
