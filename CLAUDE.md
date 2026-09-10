# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What TabSINT is

TabSINT is an open-source Angular 17 + Capacitor 6 app for administering tablet-based hearing exams and general-purpose questionnaires. The Angular web app in `src/` is built to `dist/` and packaged by Capacitor into a native Android (and iOS) application. Exams/questionnaires are authored as JSON **protocols** and presented as a series of **pages**; results upload to a server or save locally. Target platform is Android tablets connected to audiometric hardware over Bluetooth.

## Common commands

```bash
npm install                 # install deps
npm run start               # ng serve — run in browser at localhost:4200 (fastest dev loop)
npm test                    # ng test with coverage (Karma + Jasmine, watch mode)
npm run test:headless       # single-run headless tests (used in CI)
npm run lint                # ng lint (eslint + angular-eslint + prettier)
npm run format              # prettier --write .
npm run run.android         # build web, cap sync, deploy to connected Android device via adb
npm run clean               # rm dist and .angular/cache
```

Run a single test file: `ng test --include='**/exam.service.spec.ts'`. The browser dev loop (`npm run start`) is the fastest way to verify most changes; device features (Bluetooth audiometers, filesystem) require `run.android` on real hardware.

The three local Capacitor plugins (`tabsintfs`, `tabsintcha`, `tabsintaudio`) are installed as `file:` dependencies. Rebuild them only when changing plugin code: `npm run build:plugin.tabsintfs` (and `.tabsintcha`, `.tabsintaudio`).

## Architecture (MVC)

The app follows an MVC pattern enforced by directory structure under `src/app/`. Watch dependency-injection direction carefully to avoid circular injections — the layering is intentional:

- **`utilities/`** — pure functions/classes (Angular injectable services) that depend on _neither_ models nor services, so they're callable anywhere. Helper functions for protocols, results, response areas, parsing, encryption, etc.
- **`models/`** — injectable services that hold app data (`app`, `disk`, `page`, `protocol`, `results`, `state`, `devices`, `version`). Interact via getters/setters; each model has an adjacent `.interface.ts`. `disk` persists across app restarts.
- **`services/`** (`src/app/services/`) and **`controllers/`** (`src/app/controllers/`) — both are injectable services. Controllers hold higher-level orchestration (`exam`, `protocol`, `results`, `admin`, `network`); services hold lower-level capabilities (`file`, `logger`, `audio`, `qr`, `sqLite`, `notifications`, `tasks`, `gitlab`, and device managers).
- **`views/`** — Angular components (TS class + HTML template + CSS + spec).
- **`interfaces/`**, **`guards/`** (type guards), **`types/`** — TypeScript typing; `any` is avoided.

See `developer_guide/architecture.md` (and `architecture.png`) for the full diagram.

### Exam engine (`controllers/exam.service.ts`)

The exam is a state machine. It starts NOT-READY; loading a protocol moves it to READY; `begin()` builds a `protocolStack` and sets `currentPage`. Every change to `currentPage` emits on `currentPageSubject` (an RxJS subject). Response areas and other UI subscribe to it for real-time DOM updates. The submit button calls `submit()` (defaults to `submitDefault()` → `advancePage()`), which advances within `protocolStack` or follows a page's `followOn` to load the next sub-protocol. This is the core of how pages flow — read it before touching exam navigation.

### Response areas (`src/app/views/response-area/response-areas/`)

Response areas render exam content and are how the app collects answers (audiogram, bekesy, mrt, likert, multiple-choice, dpoae, immittance, custom-js, etc.). Each is a self-contained directory with HTML, TS, CSS, spec, and an interface file describing its protocol parameters. JSON schema for protocols/pages/response areas lives in `src/schema/`. Adding an exam type means adding a response area here plus its schema.

### Custom JS response areas

The `custom-response-area` lets protocol authors inject their own HTML/JS at runtime. Compiled-ahead-of-time, so no Angular available to that code. It exposes TabSINT internals on `window.tabsint` (`logger`, `resultsService`, `examService`, `fileService`, `resultsModel`, `pageModel`, `protocolModel`, `diskModel`, `stateModel`) — these must never be overwritten. See `developer_guide/custom-js.md`. Examples: `src/assets/protocols/develop/custom-response-areas/`.

### Devices

Hearing hardware is integrated via manager/adapter pairs in `src/app/services/devices/` (WAHTS, Tympan, CHA, DuoDose, Svantek) with matching device models in `src/app/models/devices/`. Bluetooth uses `@capacitor-community/bluetooth-le`. The native `tabsintcha` and `tabsintaudio` plugins back CHA/audio device communication; `tabsintfs` provides filesystem access beyond Capacitor's default scoped storage.

## Conventions (from `developer_guide/conventions.md`)

- **Commits**: imperative present tense (`change` not `changed`), lowercase first letter, no trailing period, lines ≤100 chars.
- **null vs undefined**: use `null` when a variable must exist but has no meaningful value yet; use `undefined` when it need not exist yet.
- Keep services short (~400 lines max), functions single-purpose, ≤3 args, no boolean flag args; use guard clauses. Comments only as JSDoc on functions/classes.
- Error messages spoken from TabSINT's perspective ("TabSINT encountered an issue…").
- Angular selectors: components `app-` kebab-case (element), directives `app` camelCase (attribute) — enforced by eslint.
- SonarLint/SonarQube is run in CI; address issues before merging.

## Git / CI

- Branches: `main` (release) and `develop` (integration); feature branches merge into `develop` via merge request. Current work is on `feature/*` branches.
- CI (`.gitlab-ci.yml`) runs hadolint, `npm run test:headless`, and Android builds inside Docker. Build variants: `run.build` (dev suffix), `run.build.beta:ci`, `run.build.production:ci`.

## Porting a response area from legacy TabSINT

Most response areas are ports of the legacy **AngularJS 1.5.11** app at `/home/val/tabsint` (directives/controllers, bundled by Parcel/Cordova). Before starting, read **both** `CLAUDE.md` files — `/home/val/tabsint/CLAUDE.md` describes the legacy architecture (services under `src/scripts/services/`, the `cha*` hardware services, gettext translations) and this file describes the Angular target. The two architectures differ significantly; **adapt the behavior, don't transliterate** the AngularJS code. CHA hardware exams especially: the legacy `chaExams`/`cha` services map onto this app's `DevicesService` (`queueExam`/`examSubmission`/`requestResults`/`abortExams`/`setSoftwareButtonState`), and legacy `chaExams.wait.forReadyState` (which polled `requestStatus`) becomes a `requestResults` polling loop — see `memr-exam.component.ts` for the canonical poll-until-`READY` pattern.

The gap exam (`gapResponseArea`) is a complete worked example of the steps below.

**Plan executed (file-by-file):**

1. **Find the source.** Locate the legacy directive/controller (e.g. `src/scripts/components/response-areas/...`), its HTML, and its result/plot/schema helpers (legacy schema lives in `src/res/protocol/schema/`; result shaping in `src/scripts/services/cha-results/`; d3 plots in `cha-plot.js`). Find an example protocol that uses it to learn the real `examProperties`.
2. **Pick the closest existing Angular analog** under `src/app/views/response-area/response-areas/` to copy structure/conventions from (gap used `bekesy` for the software-button UX and `memr` for the poll loop; `swept-dpoae-results` for the d3 sub-component).
3. **Create the response-area directory** `src/app/views/response-area/response-areas/<name>/`:
   - `<name>.interface.ts` — `<Name>ResponseAreaInterface extends CommonResponseAreaInterface`. **Narrow `type` to the literal** (e.g. `type: 'gapResponseArea';`) or the schema typing breaks. Add interfaces for exam properties and results too.
   - `<name>.component.ts` (`@Component` selector `app-<name>-...`), `.html`, `.css`. Inject models/services with `inject()`; subscribe to `pageModel.currentPageObservable` and act when `responseArea.type === '<name>ResponseArea'`; guard against the observable emitting more than once if you auto-start anything. Use `stateModel.updateState({ isSubmittable })`, `resultsModel.updateCurrentPage({ response })`, and override `examService.submit` as needed (restore it in `ngOnDestroy`). Templates use the `| transloco` pipe.
   - Optional results/plot sub-component (d3 is imported directly, no shared chart lib).
4. **Schema** `src/schema/response-areas/<name>.schema.ts` — `export const <name>Schema: JSONSchemaType<...>`, every optional field `nullable: true`, `required: ['type']`. Mirror the legacy JSON schema.
5. **Register in five places** (all required):
   - `src/schema/page.schema.ts` — import the schema, add to the `responseArea.oneOf` array.
   - `src/app/interfaces/page-definition.interface.ts` — import the interface, add to the `ResponseArea` union. **This is the non-obvious one:** if the interface is missing from the union, the schema is not assignable to `JSONSchemaType<ResponseArea>` and `page.schema.ts` fails to compile with a deep, misleading union error.
   - `src/app/views/response-area/response-area.component.html` — add `<app-<name>-... *ngSwitchCase="'<name>ResponseArea'">`.
   - `src/app/app.module.ts` — import and declare the component(s).
   - `src/app/guards/type.guard.ts` — add an `is<Name>ResponseArea` guard (follow the existing one-liner pattern).
   - If the exam needs a device capability not yet exposed (gap needed `setSoftwareButtonState`), wire the passthrough through `cha-adapter.ts` → `cha-manager.ts` → `devices.service.ts` and both `device-{adapter,manager}.interface.ts`.
6. **Verify it compiles:** `npx tsc --noEmit -p tsconfig.app.json` for fast TS errors, then `npx ng build` for AOT template type-checking. Format/lint the changed files with `npx prettier --write <paths>` and `npx eslint <paths>`.

**Spec.** Add `<name>.component.spec.ts` next to the component. **Test behavior, not implementation** — drive the public API and assert observable outcomes (what `DevicesService` is asked to do, what UI state results), with `DevicesService` provided as a `jasmine.createSpyObj`. Mock `ExamService` too (its real constructor pulls in `ResultsService`, which can't initialize under Karma); `PageModel`/`StateModel`/`ResultsModel`/`Logger` can be real. Run a single spec headless — Karma needs a Chrome binary on this box:

```bash
CHROME_BIN=/usr/bin/chromium-browser npx ng test --include='**/<name>.component.spec.ts' --watch=false --browsers=ChromeHeadless
```

**Demo page in the develop protocol.** Make the new exam reachable for manual/on-device testing by editing `src/assets/protocols/develop/protocol.json` (mirror an existing CHA exam such as Bekesy): add a choice to the Main Menu's `multipleChoiceResponseArea`, add a matching `followOns` entry (`result.response=='<Label>'` → `{ "reference": "<subProtocolId>" }`), and add a `subProtocols` entry with the exam page plus a `{ "id": "backtomain", "reference": "MainMenu" }` page. Validate the JSON after editing. Then `npm run run.android` with the develop protocol active to exercise the real hardware; log raw `requestResults` payloads to confirm device state strings and result field names.

## Upgrading the PCC protocol from legacy TabSINT

The PCC (Personalized Comprehensive Care) battery is a large legacy protocol assembled by a MATLAB
pipeline, being ported to this app. **All PCC work lives outside this repo** at
`/home/val/pcc_upgrade/PCC_Protocol_Upgrade/` (note: `pcc_upgrade`, not `pcc_upgrate`). Nothing about
PCC is checked into `open-hearing-tabsint` — the deliverable is a protocol directory that this app can
load, not app source changes (except where a genuine engine gap is found).

### The four directories that matter

- **`migrated_protocols/`** — **per-test source of truth.** 13 already-migrated tests (`BOOM_50`,
  `TFI_50`, `THI_50`, `mld_50`, `dichotic_digits_50`, `moht_sdt_50`, `HADS_50`, `HAQ_50`, `PCLC_50`,
  `THSH40_50`, `THST40_50`, `TTSH_50`, `VFS10_50`). Each is `protocol.json` + `results.html` +
  `results.js` (+ `calibration.json` and an audio dir where the test needs one). These validate clean
  against this app's schema — start from them, don't re-migrate from `/home/val/tabsint`.
- **`GENERATOR_FIXES.md`** — the **handoff doc for the pipeline maintainer**: every open defect with
  root cause, the exact MATLAB/JS before-and-after, and which file to change. Written because the
  fixes belong in the generator, not in the emitted `protocol.json`. Keep it in sync with the error
  list below.
- **`PCC_REUSE_PLAN.md`** — how the **dashboard/scaffolding** was upgraded: which concierge fragments
  were kept, dropped, or field-transformed. Read this for _why_ the combined protocol is shaped the way
  it is.
- **`pcc creation files/`** — the MATLAB assembler the user actually runs: `compileProject.m`,
  `addTest.m`, `morefiles/appendJSON_Concierge{,_updated}.m`,
  `morefiles/moveFilesBrowser{,_updated}.m`, and the `morefiles/route_b/` engine design
  (`INSTRUCTIONS.md`, `APPENDJSON_ROUTE_B.md`). Fixes belong **here**, in the generator — not
  hand-patched into generated output.
- **`PCC_stripped_down/PCC6/`** — **the current work item.** A cut-down assembled PCC protocol (4
  tests: BOOM, TFI, THI, mld) that loads and runs but has known validation and runtime errors. This is
  what "fix the PCC protocol" refers to.

### How the assembled protocol is wired (Route B engine)

`appendJSON_Concierge.m` is a pure string-concatenator: it interleaves each test's `protocol.json`
with concierge scaffolding fragments into one combined `protocol.json`. Three generic
`customResponseArea` pages drive the battery, so **no per-test JS is needed for navigation**:

- **`pcc_select`** (`pcc_select.html` / `pcc_select.js`) — the user taps tests in run order; each tap
  pushes onto `window.pccBattery.queue`. "Start battery" calls
  `window.tabsint.examService.navigateToTarget('Runner')`.
- **`Runner`** subprotocol — 60 identical `pcc_dispatch_N` pages, all sharing
  `pcc_dispatch.html`/`pcc_dispatch.js`. Each pops the next queued test id and calls
  `navigateToTarget(id)`, **deferred via `setTimeout(0)`** so it runs after the customResponseArea
  `eval` finishes (a synchronous call re-enters page-change delivery mid-eval and breaks). When the
  queue is exhausted it routes to `PccResults`. Test subprotocols are used **unmodified** and need no
  back-reference: `Runner` is still on `activeProtocolStack`, so control returns to the next
  `pcc_dispatch_N` when a test's pages run out.
- **`PccResults`** (`pcc_results.html` / `pcc_results.js`) — generic dashboard. Reads the
  assembler-generated `window.PCC_TESTS` manifest, filters
  `resultsModel.getResults().currentExam.responses`, and renders checkbox-selected raw responses.
  Ends with `{ "id": "pcc_end", "reference": "@END_ALL" }`.

`@END_ALL` and `@PARTIAL` are the only special references [exam.service.ts:419-426](src/app/controllers/exam.service.ts#L419-L426) handles; any other `@`-containing reference is silently swallowed.

### Checking an assembled PCC protocol

Two complementary tools, both outside the repo in `/home/val/pcc_upgrade/PCC_Protocol_Upgrade/`:

**1. Structural checks — `check-pcc-protocol.js`.** Plain Node, zero dependencies, runs anywhere
(including the MATLAB build machine, without this repo). Catches the defects the JSON schema cannot
express: unresolvable `reference`s, duplicate `protocolId`s, `window.PCC_TESTS` ids that don't match
any `protocolId`, `followOns` missing a `conditional` or using a legacy inline-page target,
`htmlFilePath`/`jsFilePath` shared across different subprotocols, and custom-JS/HTML/preprocess files
missing from the deploy folder (case-sensitively — a case-only mismatch opens fine on Windows and
404s on the tablet). Exit 0/1/2 makes it usable as a build gate.

```bash
node /home/val/pcc_upgrade/PCC_Protocol_Upgrade/check-pcc-protocol.js <protocol.json>
```

Baseline on `PCC_stripped_down/PCC6/protocol.json` is 14 errors / 4 warnings; see
`GENERATOR_FIXES.md` for what each one is. `checkPccProtocols.m` (same folder) is the MATLAB wrapper
that runs it over every assembled version plus every deployed folder and errors the build on failure
— it is meant to be called from the end of `compileProject.m`.

**2. Schema validation**

Setting `validateProtocols` in preferences makes the app log AJV errors, but raw AJV output on this
protocol is ~360 errors, almost all `oneOf` branch noise (every `responseArea` is reported against all
27 branch schemas). Use the offline grouped validator instead — it picks the one branch matching each
`responseArea.type` and reports distinct error kinds with the page ids that hit them:

```bash
cd /home/val/open-hearing-tabsint   # must run here: uses this repo's node_modules + src/schema
npx ts-node --project /home/val/pcc_upgrade/PCC_Protocol_Upgrade/validate-tsconfig.json \
  --transpile-only /home/val/pcc_upgrade/PCC_Protocol_Upgrade/validate-pcc-protocol.ts \
  /home/val/pcc_upgrade/PCC_Protocol_Upgrade/PCC_stripped_down/PCC6/protocol.json
```

It also runs over any single `migrated_protocols/*/protocol.json`. If the script is missing, it is
~60 lines: import `pageSchema`/`protocolSchema`, build a `type` → `oneOf` branch map from
`pageSchema.properties.responseArea.oneOf`, then walk `pages`/`subProtocols` validating each page
against `pageSchema` minus `responseArea` and each `responseArea` against its matched branch. AJV must
be constructed as `new Ajv({ useDefaults: true, strict: false, allErrors: true })` to match
[protocol.service.ts:190](src/app/controllers/protocol.service.ts#L190), needs `ajv.addSchema(pageSchema)`
(`navMenu.schema.ts` `$ref`s `page_base`), and `--transpile-only` is required because
`JSONSchemaType` needs `strictNullChecks` that a plain ts-node config won't satisfy for the app's own
types.

### Known open errors in `PCC_stripped_down/PCC6` (verified 2026-09-10)

Full write-ups with the generator-level fix for each live in
`/home/val/pcc_upgrade/PCC_Protocol_Upgrade/GENERATOR_FIXES.md` — that doc is the one to hand to
whoever maintains the MATLAB pipeline, and it also covers two generator bugs not visible in `PCC6`
(manifest ids built from folder names rather than `protocolId`, and per-test `results.html`
collisions). Note items 1 and 2 below are artifacts of how `PCC_stripped_down` was hand-built and
transferred, **not** generator bugs.

Fix these in the generator/fragments (not in the emitted `protocol.json` — it gets overwritten on the
next `compileProject` run), then re-assemble. Ordered by severity:

1. **Runtime crash on load — the dashboard subProtocol has no `protocolId`.** The root page is
   `{ "id": "run_tests", "reference": "test_dashboard" }` and the navMenu's "Dashboard" entry targets
   `test_dashboard`, but that subProtocol declares `"title": "test_dashboard"` with no `protocolId`.
   `activeProtocolDictionary` is keyed **only** by `protocolId`
   ([process-protocol.function.ts:110-111](src/app/utilities/process-protocol.function.ts#L110-L111)),
   so the lookup in `handleProtocolReference` returns `undefined` and
   `addProtocol(undefined)` throws `TypeError: Cannot read properties of undefined (reading 'randomization')`.
   Fix: add `"protocolId": "test_dashboard"`. **This one is a `PCC_stripped_down` hand-assembly
   artifact** — the real assembler emits `"protocolId": "Concierge"`
   (`appendJSON_Concierge_updated.m:91`) and its navMenu targets
   `concierge_dashboard_audiology_speech`, so don't "fix" it in the generator. It is still worth a
   build-time assertion that every `reference` resolves, because `navigateToTargetDefault`
   ([exam.service.ts:255-260](src/app/controllers/exam.service.ts#L255-L260)) has the same unguarded
   lookup — a typo'd `navigateToTarget` id fails identically. A guard + logged error at both call
   sites would be a worthwhile app-side fix.
2. **Every `jsFilePath` is missing on disk.** The protocol references `pcc_select.js`,
   `pcc_dispatch.js`, `pcc_results.js`, `BOOMresults.js`, `MLDresults.js`, `TFIresults.js`,
   `THIresults.js`; the files present are `*_js.txt` (`pcc_select_js.txt`, …). `loadCustomJS` throws
   `Failed to fetch the file` for each. **Also a transfer artifact, not a generator bug** — only
   `.js` was renamed (every `.html` kept its extension), the same files show mojibake (`—` → `���`)
   from a lossy encoding round-trip, and `moveFilesBrowser_updated.m:24-29` already copies
   `pcc_select.js`/`pcc_dispatch.js`/`pcc_results.js` under the right names. Re-export as UTF-8
   `.js` before testing.
3. **`PccResults` shows almost nothing — the pageId prefix filter doesn't hold.** `pcc_results.js`
   matches responses with `(r.pageId || '').indexOf(testId) === 0`, but page ids don't start with the
   test's `protocolId`: `BOOM`→`boom_1` (case), `THI`→`thi_Q1` (case), `mld`→`block_1_mldTrial_1`
   (unrelated prefix). Only `TFI` matches. Response records carry **only** `pageId` — no subprotocol id
   ([results.interface.ts:17-31](src/app/models/results/results.interface.ts#L17-L31)) — so the fix is
   in the assembler: emit an explicit per-test page-id list into `window.PCC_TESTS` rather than
   assuming `protocolId` is a prefix. Compounding this, `pcc_ids_from`
   (`appendJSON_Concierge_updated.m:583-596`) builds manifest ids from the **folder name**, which
   matches the real `protocolId` in **0 of 13** migrated tests (`TFI_50` → `PH_tinnitus_1`), so every
   `navigateToTarget()` misses and crashes. Both fixes are written out in `GENERATOR_FIXES.md`.
4. **`integerResponseArea` does not exist in this app** (`returnPSWD` / page `returnCode`). No schema,
   no component, no reference anywhere in `src/`. Replace with `textboxResponseArea` (or
   `multipleInputResponseArea`); the page's `followOns` conditional compares
   `result.response!='7114'`, so whatever replaces it must record a string response.
5. **Legacy inline-page `followOns` targets are rejected** (`cal_cable_check` / page
   `cable_check_select_side`, 2 sites). Legacy allowed `followOns[].target` to be a full inline page;
   `followOnSchema` requires `target` to be a `{ reference }` object _and_ requires `conditional`.
   Fix: hoist each inline target into its own subProtocol and reference it. Two of the nested targets
   also carry `followOns: [{ "target": { "reference": "cal_cable_check" } }]` with **no**
   `conditional` — `findFollowOn` ([exam.service.ts:490-499](src/app/controllers/exam.service.ts#L490-L499))
   only evaluates followOns that _have_ a `conditional`, so an unconditional followOn is silently
   ignored at runtime as well as failing validation. Give it `"conditional": "true"`.
6. **`verticalSpacing: "20px"` must be a number** (8 sites, all in `BOOM` — the only unclean
   `migrated_protocols` entry). Change to `20` in `migrated_protocols/BOOM_50/protocol.json`.

**Silent no-ops (not validation errors, since `pageSchema` sets `additionalProperties: true` and the
response-area branches don't forbid extras) — these are dropped without warning:**
`multipleChoiceResponseArea.horizontalSpacing` (99 sites — no such property in
`multiple-choice.schema.ts`) and page-level `spacing` (1 site, `returnCode`). Decide whether to drop
them from the fragments or add real support.

**Also worth knowing:** `pcc_select` has `responseRequired: false`, so TabSINT's own Submit button is
live alongside the page's "Start battery" button — pressing Submit advances to `pcc_cal_remind` and
skips the battery entirely. `pcc_cal_remind` and `pcc_return_code` are still placeholder pages
("Need to incorporate cal remind into pcc_select?"). `returnHereAfterward: true` on the navMenu's
"Calibrate Audiometer" entry is cosmetic — `exam.service` has it as a TODO and won't actually return.

### Recurring gotchas

- **Custom JS/HTML paths resolve against one flat, protocol-wide root** — `ProtocolMetaInterface`
  (`path`/`contentURI`) is set once per protocol load and never varies per page (see
  [load-custom-js.ts](src/app/utilities/load-custom-js.ts) and
  [process-protocol.function.ts](src/app/utilities/process-protocol.function.ts)). There is no
  subProtocol-scoped folder concept, and `moveFilesBrowser.m` flattens on disk too. Every test in
  `migrated_protocols/` names its files `results.html`/`results.js`, so **they collide when stitched**
  — the assembler must rename them per test (`BOOMresults.js`, `MLDresults.js`, … as
  `PCC_stripped_down/PCC6` already does) or write a subdirectory into the path string.
  `wavfiles[].path` _does_ handle subdirectories fine (`mld_audio/mldTrial1.wav`).
- **`preProcessFunction` files CAN be shared** across pages and tests, unlike customResponseArea JS:
  the file is `eval`'d in full but the page's named `function` is then invoked explicitly, so one
  `preprocess.js` holding `mldSetup()`, `boomSetup()`, … works as long as each page names a distinct
  function. `customResponseArea`'s `jsFilePath` has no name-based dispatch — the whole file is
  `eval`'d, so sharing means two pages running identical code.
- **Two field transforms the legacy fragments always need:** `preProcessFunction: "fn"` (bare string)
  → `{ "filepath": "fn.js", "function": "fn" }` (both required, see
  [page.schema.ts](src/schema/page.schema.ts)); and `customResponseArea`'s `html`/`js` holding a
  _file path_ → `htmlFilePath`/`jsFilePath` (the new app treats `html`/`js` as inline content).
- **Converting a legacy `results.html`/`results.js` (the "RAADS recipe"):** `{{binding}}` →
  `<b id="…"></b>` filled via `getElementById().textContent`; `$scope.responses`/`$scope.flags` →
  `window.tabsint.resultsModel.getResults().currentExam.{responses,flags}`; drop
  `ng-if`/`ng-init`/`ng-controller`. HTML is injected with `innerHTML` and the JS `eval`'d after, so
  QR/PDF417 code needs define-before-use, `var`, an IIFE, and explicitly declared globals to survive
  strict eval.
- Deploying a version for on-device testing means copying to `src/assets/protocols/PCC_<version>/`
  and registering it in `constants.ts` (`DeveloperProtocols`) **and** `disk.schema.ts`
  (`availableProtocolsMeta`).
