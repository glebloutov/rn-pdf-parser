# Manual test guide — step by step

A click-by-click walkthrough of every acceptance scenario: **what to run → what to tap → what you must see**. Do it once on **iOS** and once on **Android**. Texts below are the English UI (set the device language to English, or expect the Russian equivalents).

Legend: `$` = run in a terminal (project root) · **Tap** = action in the app · ✅ = expected result (if you don't see it, the scenario fails — note it in the README results table).

Mock timing to keep in mind: a new job is `queued` for ~0.25 s, `processing` until ~1 s, then `ready`. "Queued" and "Processing" may flash by quickly — that's normal.

---

## 0. One-time setup

| # | Do | Expect |
|---|---|---|
| 0.0 | `$ git clone https://github.com/glebloutov/rn-pdf-parser.git && cd rn-pdf-parser` | Project folder with `package.json`, `src/`, `mock-server/`, `docs/` |
| 0.1 | `$ node -v` (optional: `nvm install && nvm use` for Node 26 from `.nvmrc`) | `v22.13+`, `v24.3+` or `v26+` |
| 0.2 | `$ npm ci` | Installs without errors |
| 0.3 | `$ npm run mock:oversize` | `Created fixtures/oversize.csv (10485771 bytes; limit 10485760)` |
| 0.4 | iOS only: `$ npm run pods` | `Pod installation complete!` |
| 0.5 | Only for a physical device or Android without `adb reverse`, **before starting Metro** (section 1): `$ cp .env.example .env` and set `MOCK_API_URL` (see `.env.example`) | Address shown on **Diagnostics**. If Metro was already running: `npm start -- --reset-cache` |

## 1. Start everything (each session)

Use three terminals.

| # | Do | Expect |
|---|---|---|
| 1.1 | Terminal 1: `$ npm run mock` | `Synthetic mock listening at http://127.0.0.1:8787` — leave it running |
| 1.2 | Terminal 2: `$ npm start` | Metro bundler running — leave it running |
| 1.3 | **iOS**, terminal 3: `$ npm run ios` | Simulator opens, app **rn-pdf-parser** launches |
| 1.3 | **Android**: `$ npm run android:dev` (starts the first emulator if none is running, waits for boot, forwards port 8787, builds and runs) | App launches on the emulator |
| 1.4 | Put the fixtures where the system picker can see them — **iOS**: open the **Files** app once in the simulator, then `$ npm run e2e:fixtures:ios` · **Android**: `$ npm run e2e:fixtures:android` | iOS: `Fixtures copied to: …/rn-pdf-parser-fixtures` · Android: `Fixtures pushed to /sdcard/Download…` |
| 1.5 | In the app | ✅ Title **Statement import**, card **No statement imported**, button **Choose statement (PDF or CSV)**, link **Diagnostics** in the header (top right) |

**Where the files are in the picker**
- iOS: **Browse → On My iPhone → rn-pdf-parser-fixtures**. Two files are called "statement": the **CSV is 112 bytes**, the **PDF is 34 KB**. iOS reopens the picker in the last folder you used.
- Android: **☰ → Downloads**, files are shown with full names (`statement.csv`, …).

**Useful commands at any time** (terminal 3)

| Command | What it does |
|---|---|
| `$ npm run mock:state` | Prints scenario + counters (`createRequests`, `newJobs`, `duplicateHits`, `deleteRequests`) + jobs |
| `$ npm run mock:reset` | Clears the mock (next job is `job-demo-001` again) |
| `$ npm run mock:scenario -- lost_ack` | Switches scenario (`happy`, `lost_ack`, `stale_status`, `delete_failure`) |
| Kill the app — iOS: `$ xcrun simctl terminate booted com.rnpdfparser` · Android: `$ adb shell am force-stop com.rnpdfparser`. By hand: iPhone with a Home button (SE) — ⇧⌘H twice, swipe the app up; Face ID iPhones — swipe up from the bottom and hold, swipe the app up; Android — Recents, swipe the app away | Simulates the app being killed |
| Relaunch — iOS: `$ xcrun simctl launch booted com.rnpdfparser` · Android: `$ adb shell monkey -p com.rnpdfparser 1` | Normal relaunch (state is kept) |

The same scenario switch / counters / reset are on the in-app **Diagnostics** screen.

**Before every scenario:** if an import is on screen, finish it (delete it, or tap **Start a new import**), or tap **Clear local data** at the bottom; then **Diagnostics → Reset mock → happy** (or `$ npm run mock:reset`).

---

## 2. Scenario A — happy path (PDF/CSV accepted, report, details, delete)

| # | Do | Expect |
|---|---|---|
| A.1 | **Diagnostics** → **Reset mock** → **happy** → back | ✅ Mock counters all `0`, current scenario `happy` |
| A.2 | **Tap** **Choose statement (PDF or CSV)** | System picker opens (iOS Files / Android DocumentsUI) |
| A.3 | Pick **statement.csv** | ✅ Card **Confirm statement**: File `statement.csv`, Size `112 B`, Format `CSV`; hint "…Only after you confirm are its bytes sent…" ✅ `$ npm run mock:state` → `createRequests: 0` (nothing sent yet) |
| A.4 | **Tap** **Upload statement** | ✅ Spinner on the button, then briefly **Queued — waiting for processing** / **Processing** with a spinner — **no charges and no total** while not ready; green toast "Upload accepted by the server." |
| A.5 | Wait ~1–2 s | ✅ Green toast "The report is ready."; green **Ready**; text `Job job-demo-001 · revision 3`; card **Recurring charges** with **StreamBeam** A$19.99 and **BrightGrid** A$132.00; **Total per month A$151.99** |
| A.6 | `$ npm run mock:state` | ✅ `createRequests: 1`, `newJobs: 1`, `duplicateHits: 0` |
| A.7 | **Tap** **Details** under BrightGrid | ✅ Screen **Recurring charge**: Merchant BrightGrid, Amount A$132.00, Cadence Monthly, Last seen Oct 3, 2026. ✅ **No "cancel subscription"** or any other action |
| A.8 | Go back | Ready screen again |
| A.9 | **Tap** **Delete import** | ✅ **Deleting** + "Deletion requested. Waiting for the server to confirm…" — the app does **not** say deleted yet |
| A.10 | Wait ~1–2 s | ✅ Green toast "The server confirmed the deletion."; **Deleted** + "Deleted on the server. No statement data is kept for this import."; report gone; button **Start a new import** |
| A.11 | `$ npm run mock:state` | ✅ job `job-demo-001` `status: deleted`, `deleteRequests: 1` |
| A.12 | **Tap** **Start a new import** | ✅ Back to **No statement imported** |
| A.13 | Repeat A.1–A.5 with **statement.pdf** | ✅ Size `33.1 KiB`, Format `PDF`; reaches Ready with the same two charges and A$151.99 |

## 3. Scenario B — lost acknowledgement + relaunch (no second job)

| # | Do | Expect |
|---|---|---|
| B.1 | **Diagnostics** → **Reset mock** → **lost_ack** → back | Current scenario `lost_ack` |
| B.2 | Pick **statement.csv** → **Upload statement** | ✅ Orange **Upload result unknown** + explanation and an amber toast; buttons **Check again** and **Retry upload**. The app does **not** pretend it succeeded |
| B.3 | `$ npm run mock:state` | ✅ `createRequests: 1`, `newJobs: 1` already now — the server *did* create the job, only the answer was lost |
| B.4 | Kill the app (command above), then relaunch it | ✅ A centred loader "Checking whether the server received the upload…" ("Upload result unknown" does **not** flash first), then without any tap **Ready** (or Processing → Ready) with `Job job-demo-001`, the two charges and the toast "The report is ready." |
| B.5 | `$ npm run mock:state` | ✅ Still `newJobs: 1`, `createRequests: 1` — **no second job, nothing re-sent on relaunch** |
| B.6 | (Variant, after Reset mock + lost_ack) repeat B.2, then **tap Check again** instead of relaunching | ✅ Spinner on the button; job found → Ready; `createRequests: 1` |
| B.7 | (Variant) repeat B.2, then **tap Retry upload** | ✅ Ready with the same `job-demo-001`; `npm run mock:state` → `newJobs: 1`, `duplicateHits: 1` (same key → same job) |
| B.8 | **Diagnostics → happy** | Leave lost_ack, otherwise every new upload loses its answer |

## 4. Scenario C — stale status (UI must not roll back)

| # | Do | Expect |
|---|---|---|
| C.1 | **Diagnostics** → **Reset mock** → **happy** → back; pick **statement.csv** → **Upload statement** | ✅ **Ready**, `revision 3` |
| C.2 | **Diagnostics** → **stale_status** → back | Returning to the screen triggers a refresh (server answers ready / revision 3) |
| C.3 | **Tap** **Refresh** two or three times | The mock now answers `processing / revision 2` once |
| C.4 | Look at the screen after each tap | ✅ Still **Ready**, still `revision 3`, charges still visible — **never** "Processing". ✅ Under the job line (dev build): **Ignored outdated server answers: 1 (last: processing · revision 2)** — proof the old answer arrived and was ignored. In `happy` this line never appears |
| C.5 | **Diagnostics → happy** | — |

## 5. Scenario D — failed deletion, then successful retry

| # | Do | Expect |
|---|---|---|
| D.1 | **Diagnostics** → **Reset mock** → **happy** → back; pick **statement.csv** → **Upload statement** | ✅ **Ready** |
| D.2 | **Diagnostics** → **delete_failure** → back | — |
| D.3 | **Tap** **Delete import** | ✅ Amber toast "Deletion not confirmed. You can retry it." ✅ Warning "Deletion was not confirmed by the server. The data may still be stored on the server." + "The server is temporarily unavailable." ✅ Status still **Ready**, report still visible. ✅ **No** "Deleted" text. Button **Retry deletion** |
| D.4 | `$ npm run mock:state` | ✅ job status `ready` (not deleted), `deleteRequests: 1` |
| D.5 | **Diagnostics** → **happy** → back | — |
| D.6 | **Tap** **Retry deletion** | ✅ "Deletion requested. Waiting for the server to confirm…" then, after ~1 s, **Deleted** + "Deleted on the server…" |
| D.7 | `$ npm run mock:state` | ✅ job `deleted`, `deleteRequests: 2` (same delete key reused) |
| D.8 | (Optional) In D.3 kill + relaunch the app instead of switching | ✅ After relaunch: still "Deletion was not confirmed…" + **Retry deletion**; never "Deleted" |

## 6. Scenario E — spoofed and oversize files rejected before upload

| # | Do | Expect |
|---|---|---|
| E.1 | Make sure no import is active; **Diagnostics** → **Reset mock** → back | — |
| E.2 | `$ npm run mock:state` | Note `createRequests` (should be `0`) |
| E.3 | **Choose statement** → pick **spoofed.pdf** | ✅ Red toast "This file is not a PDF or CSV statement and was not sent." (hides after a few seconds) — no confirm screen |
| E.4 | **Choose statement** → pick **oversize.csv** (10.5 MB) | ✅ Red toast "The file is larger than 10 MiB and was not sent." |
| E.5 | `$ npm run mock:state` | ✅ `createRequests` **unchanged** (`0`) — nothing reached the server |
| E.6 | (iOS) The original files are untouched: Files app → On My iPhone → rn-pdf-parser-fixtures | ✅ All four files still there |

## 7. Scenario F — cancel and local cleanup

| # | Do | Expect |
|---|---|---|
| F.1 | Pick **statement.csv** → on **Confirm statement** tap **Cancel** (Android: the system Back button does the same) | ✅ Back to **No statement imported**; `mock:state` → `createRequests` unchanged |
| F.2 | Pick **statement.csv** → **Upload statement** → Ready → scroll down → **Clear local data** | ✅ Screen returns to **No statement imported** (the hint says server data is **not** deleted) ✅ `mock:state` → the job is still there (`ready`), because only local data was removed |

## 8. Accessibility — large font and small screen

| # | Do | Expect |
|---|---|---|
| G.1 | Large font — iOS: `$ xcrun simctl ui booted content_size accessibility-extra-extra-extra-large` · Android: `$ adb shell settings put system font_scale 2.0` | System text becomes huge |
| G.2 | Relaunch the app and go through A.2–A.10 | ✅ All text wraps (nothing cut off), every button is reachable by scrolling and tappable |
| G.3 | Reset — iOS: `$ xcrun simctl ui booted content_size large` · Android: `$ adb shell settings put system font_scale 1.0` | Normal size |
| G.4 | Small screen — iOS: an **iPhone SE (3rd generation)** simulator · Android: an emulator with 720×1280 @ 320 dpi (or `$ adb shell wm size 720x1280 && adb shell wm density 320` on any emulator) | Text and spacing are a bit smaller (compact theme below 390 pt/dp); everything else as in A.2–A.10 |
| G.5 | Reset Android display: `$ adb shell wm size reset && adb shell wm density reset` | Normal size |
| G.6 | Watch the top of the screen during A.2–A.10 | ✅ A toast appears for each event: green (upload accepted, report ready, deletion confirmed, local data cleared), amber (upload result unknown, deletion not confirmed, not found yet), red (file rejected, request failed); it hides by itself and never blocks a tap |

## 9. Automated checks (optional, same scenarios without tapping)

| # | Do | Expect |
|---|---|---|
| H.1 | `$ npm test` | `Tests: 149 passed` (unit + integration against the real mock + UI) |
| H.2 | iOS: `$ npm run e2e:ios` (fixtures pushed, app installed, mock running) | `5/5 Flows Passed` |
| H.3 | Android: `$ npm run e2e:android` | `5/5 Flows Passed` (also pushes the fixtures first) |

## 10. Finish

| # | Do | Expect |
|---|---|---|
| Z.1 | Fill the per-platform results tables in `README.md` (device, OS version, date, pass / fail / not verified per row) | Only rows you actually ran are marked passed |
| Z.2 | Stop the mock and Metro (Ctrl+C in terminals 1 and 2) | — |
| Z.3 | (Optional) `$ npm run mock:reset` for a clean next run; a short version of this guide: `docs/manual-test-checklist.md` | Counters back to `0` |
