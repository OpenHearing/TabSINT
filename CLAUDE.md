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

- **`utilities/`** — pure functions/classes (Angular injectable services) that depend on *neither* models nor services, so they're callable anywhere. Helper functions for protocols, results, response areas, parsing, encryption, etc.
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
