# Common Response Area Parameters

Four parameters appear on response areas across many exam types. This page documents what each one
does, its per-type default, and the traps that come with it.

## How defaults actually get applied

Every response area schema in `src/schema/response-areas/` declares defaults, but **ajv does not
apply `default` keywords inside a `oneOf`**, and `page.schema.ts` lists all response areas as
`responseArea.oneOf`. Protocol validation therefore never fills these in. On top of that, validation
only runs at all when the `validateProtocols` preference is set.

So a response area's defaults are applied by the code that reads them, in one of two ways:

- **Component-owned parameters** are seeded from the schema at construction and overlaid on each page
  change with `this.x = responseArea.x ?? schema.properties.x.default`. Most parameters work this way.
- **Engine-owned parameters** (`responseRequired`, `enableSkip`) are read by `exam.service` and
  `exam.component`, not by the response area component. They resolve through
  `getDefaultResponseRequired()` / `getDefaultEnableSkip()` in
  `src/app/utilities/exam-helper-functions.ts`, which read the schema default at the point of use.

If you add a parameter with a default, wire it up in one of those two ways. Declaring it in the
schema alone does nothing.

## `responseRequired`

Whether the page can be submitted before a response has been recorded. Combined with
`doesResponseExist` by `StateModel.setPageSubmittable()` to produce `isSubmittable`, which enables
the Submit button.

Defaults split along a clear line:

- **Data-entry areas default to `true`** — the subject must answer before Submit lights up.
- **Device-driven exam areas default to `false`** — the exam has no "response" in the questionnaire
  sense. These components disable Submit themselves by writing `isSubmittable` directly while the
  exam runs.

The `false` group is easy to misread. It does **not** mean "no response is collected", it means "the
engine's response-required check is not the mechanism gating Submit for this exam". A consequence
worth knowing: a page whose response area defaults to `false` renders with Submit already enabled,
until the component's own setup disables it.

## `autoSubmit`

Submit the page automatically when it is complete, instead of waiting for the Submit button. Only
supported by the types listed in the table below — setting it on any other type does nothing.

**Not related to the page-level `autoSubmitDelay`.** That is a plain timer on the page (not the
response area) that submits after N milliseconds regardless of what the response area is doing; see
`handleAutoSubmitDelay()` in `exam.service.ts`.

`multipleChoiceResponseArea` and `buttonGridResponseArea` default to `true` because they have always
auto-submitted on selection. Set `autoSubmit: false` to require an explicit Submit — on a button grid
that is also what lets a subject select several choices before submitting.

## `enableSkip`

Shows a Skip button next to Submit. Skipping flags the page result with `isSkipped: true`, forces the
page submittable, drops any submit override a response area installed, and advances — see
`skipDefault()` in `exam.service.ts`. A response area can override `examService.skip` to record
something more specific (`mpanlResponseArea` does).

The Skip button also appears for every page when the `debugMode` and `adminSkipMode` preferences are
both on, which is the intended way to click through an exam during development. Both are checkboxes
on the TabSINT configuration page: turn on **Admin Mode**, then **Admin Skip Mode** underneath it.

**Not related to `skipIf`.** `skipIf` is a conditional on a page or protocol reference that skips the
page outright at navigation time, with no button and no result recorded.

## `exportToCSV`

Removed. It existed in TabSINT Classic and has no effect in this app. Because `pageSchema` sets
`additionalProperties: true` and the response area branches do not forbid extra keys, a legacy
protocol that still carries `exportToCSV` validates cleanly and the field is silently ignored.

## Defaults by response area type

`—` means the parameter is not supported by that type.

| Response area type                | `responseRequired` | `enableSkip` | `autoSubmit` |
| --------------------------------- | ------------------ | ------------ | ------------ |
| `textboxResponseArea`             | `true`             | `false`      | —            |
| `textboxResponseAreaResultViewer` | `false`            | `false`      | —            |
| `subjectIdResponseArea`           | `true`             | `false`      | —            |
| `checkboxResponseArea`            | `true`             | `false`      | —            |
| `duodoseDownloadResponseArea`     | `true`             | `false`      | —            |
| `buttonGridResponseArea`          | `true`             | `false`      | `true`       |
| `multipleChoiceResponseArea`      | `true`             | `false`      | `true`       |
| `multipleInputResponseArea`       | `true`             | `false`      | —            |
| `manualAudiometryResponseArea`    | `false`            | `false`      | —            |
| `calibrationResponseArea`         | `false`            | `false`      | —            |
| `fplCalibrationResponseArea`      | `false`            | `false`      | —            |
| `likertResponseArea`              | `true`             | `false`      | `false`      |
| `sweptDPOAEResponseArea`          | `false`            | `false`      | `false`      |
| `dpGramResponseArea`              | `false`            | `false`      | `false`      |
| `WAIResponseArea`                 | `false`            | `false`      | —            |
| `mrtResponseArea`                 | `false`            | `false`      | —            |
| `memrResponseArea`                | `false`            | `false`      | `false`      |
| `customResponseArea`              | `false`            | `false`      | —            |
| `qrCodeResponseArea`              | `true`             | `false`      | `true`       |
| `bekesyResponseArea`              | `true`             | `false`      | `true`       |
| `threeDigitResponseArea`          | `false`            | `false`      | `false`      |
| `hintResponseArea`                | `false`            | `false`      | `true`       |
| `gapResponseArea`                 | `false`            | `false`      | `false`      |
| `hughsonWestlakeResponseArea`     | `false`            | `false`      | `false`      |
| `bhaftResponseArea`               | `false`            | `false`      | `false`      |
| `mpanlResponseArea`               | `false`            | `true`       | `false`      |
| `bekesyLikeResponseArea`          | `false`            | `false`      | `false`      |

## Demo pages

The built-in develop protocol (`src/assets/protocols/develop/protocol.json`) exercises all four
parameters from its Main Menu:

- **Skip Page** — `enableSkip` with a required response, over a graded response area, absent, and on
  a page with `followOns`.
- **Auto Submit / Response Required** — `autoSubmit` on and off for multiple choice and button grid,
  `autoSubmit` with `other`, `responseRequired` set and omitted, and both `autoSubmitDelay` cases.
- **Custom Response Area** — the _TabSINT Globals_ page pairs `enableSkip` with custom JS that holds
  Submit disabled, so Skip has an override to bypass.

`calibrationResponseAreaResultViewer` has a schema in
`src/schema/definitions/protocol-calibration.schema.ts` but no component and no entry in
`page.schema.ts`'s `oneOf`. It is unimplemented and cannot be used in a protocol.

[PREVIOUS: Migration Guide from TabSINT Classic](migration-guide.md)

[NEXT: CustomJS Response Area Guide](custom-js.md)

[BACK TO INDEX](developer-guide-index.md)
