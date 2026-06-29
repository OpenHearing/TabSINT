# PCC Battery Spike (Phase 0)

Throwaway spike validating the **ordered auto-run queue** + **selectable results dashboard**
mechanic for the PCC/Concierge upgrade — before committing any MATLAB emitter work.

## What it proves

1. **Ordered queue** — `select.js` builds `window.pccBattery.queue` in click order.
2. **Auto-run** — `dispatch.js` pops the next id and calls
   `window.tabsint.examService.navigateToTarget(id)` (deferred with `setTimeout(0)` to avoid
   reentrant page-change delivery during the customResponseArea `eval`).
3. **Loop** — each test subProtocol ends with `{ "reference": "PccDispatcher" }`, so control
   returns to the dispatcher for the next queued test.
4. **Exhaustion** — when the queue is empty the dispatcher routes to `PccResults`.
5. **Selectable results** — `results.js` reads `resultsModel.getResults().currentExam.responses`,
   groups by `pageId` prefix (`TestA*`, `TestB*`), and renders only the ticked tests.

## How to run

1. `npm start` (ng serve). In a fresh app/disk state, `pcc_spike` appears under Developer
   protocols. (Defaults only seed on first run — if it's missing, clear app storage to reseed,
   since it was intentionally left out of the disk schema `required` list.)
2. Load **pcc_spike**, start the exam.
3. On the selection page: e.g. Add Test B → Add Test A → Add Test B → **Start battery**.
4. Confirm tests run in that exact order (B, A, B), each with its questions.
5. On the dashboard, tick Test A and/or Test B → **Show selected results** → verify only the
   chosen tests' responses render. Press **Submit** to end.

## Validation checklist (the make-or-break questions)

- [ ] Tests execute in the selected order, back-to-back, with no manual menu step.
- [ ] Responses from every test accumulate (visible in the dashboard and exported results).
- [ ] `activeProtocolStack` growth over the run is bounded/acceptable (it grows ~per selected
      test; `@END_ALL` clears it). Watch logs / memory for long batteries.
- [ ] Back button behaves acceptably during the battery (`enableBackButton: false` here).
- [ ] No reentrancy/timing errors in the console from `navigateToTarget` during the eval.

If any of these fail, fall back to the manual-menu pattern (mini_pcc style) for the battery.

## Files

- `protocol.json` — root selection page + `PccDispatcher`, `TestA`, `TestB`, `PccResults` subProtocols.
- `custom-response-areas/select.{html,js}` — ordered queue builder.
- `custom-response-areas/dispatch.{html,js}` — queue dispatcher.
- `custom-response-areas/results.{html,js}` — selectable results dashboard.

Registered in `src/app/utilities/constants.ts` (`DeveloperProtocols`) and
`src/schema/definitions/disk.schema.ts` (`availableProtocolsMeta`).
