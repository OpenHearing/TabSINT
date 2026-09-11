import { DeveloperProtocols } from '../constants';

/**
 * Canonical list of response-area types, mirrored from every `*ngSwitchCase` in
 * `src/app/views/response-area/response-area.component.html`. Keep in sync with that file.
 */
const EXPECTED_RESPONSE_AREA_TYPES = [
  'textboxResponseArea',
  'textboxResponseAreaResultViewer',
  'likertResponseArea',
  'multipleInputResponseArea',
  'manualAudiometryResponseArea',
  'multipleChoiceResponseArea',
  'customResponseArea',
  'calibrationResponseArea',
  'fplCalibrationResponseArea',
  'sweptDPOAEResponseArea',
  'dpGramResponseArea',
  'mrtResponseArea',
  'WAIResponseArea',
  'memrResponseArea',
  'subjectIdResponseArea',
  'checkboxResponseArea',
  'duodoseDownloadResponseArea',
  'buttonGridResponseArea',
  'qrCodeResponseArea',
  'bekesyResponseArea',
  'threeDigitResponseArea',
  'hintResponseArea',
  'gapResponseArea',
  'hughsonWestlakeResponseArea',
  'bhaftResponseArea',
  'mpanlResponseArea',
  'bekesyLikeResponseArea',
];

/**
 * Page-level `PageDefinition` fields (other than `responseArea`) worth demonstrating somewhere,
 * as opposed to purely structural fields like `id`/`title`/`followOns`.
 */
const EXPECTED_PAGE_FEATURES = [
  'video',
  'image',
  'navMenu',
  'progressBarVal',
  'skipIf',
  'repeatPage',
  'setFlags',
  'preProcessFunction',
  'wavfiles',
  'chaWavFiles',
  'dosimetry',
  'svantek',
  'helpText',
  'autoSubmitDelay',
];

/**
 * Response-area parameters that change how a page is submitted. They are collected the same way as
 * the page-level features, since the collector walks into `responseArea` objects too.
 */
const EXPECTED_SUBMIT_FEATURES = ['responseRequired', 'autoSubmit', 'enableSkip'];

const BUILT_IN_PROTOCOL_NAMES = ['develop', 'tabsint-example', 'tympan-example', 'wahts-example'];

/** Recursively collects every `responseArea.type` value found anywhere within a protocol object. */
function collectResponseAreaTypes(node: unknown, found: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach(item => collectResponseAreaTypes(item, found));
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const responseArea = obj['responseArea'];
    if (responseArea && typeof responseArea === 'object' && typeof (responseArea as Record<string, unknown>)['type'] === 'string') {
      found.add((responseArea as Record<string, unknown>)['type'] as string);
    }
    Object.values(obj).forEach(value => collectResponseAreaTypes(value, found));
  }
}

/** Recursively collects which of the given page-level feature keys appear anywhere within a protocol object. */
function collectPageFeatures(node: unknown, featureKeys: string[], found: Set<string>): void {
  if (Array.isArray(node)) {
    node.forEach(item => collectPageFeatures(item, featureKeys, found));
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    featureKeys.forEach(key => {
      if (key in obj) {
        found.add(key);
      }
    });
    Object.values(obj).forEach(value => collectPageFeatures(value, featureKeys, found));
  }
}

describe('Built-in protocol registry content coverage', () => {
  it('demonstrates every registered response-area type in at least one built-in protocol', () => {
    const found = new Set<string>();
    BUILT_IN_PROTOCOL_NAMES.forEach(name => collectResponseAreaTypes(DeveloperProtocols[name], found));

    const missing = EXPECTED_RESPONSE_AREA_TYPES.filter(type => !found.has(type));
    expect(missing).withContext('response-area types missing from every built-in protocol').toEqual([]);
  });

  it('demonstrates every page-level feature in at least one built-in protocol', () => {
    const found = new Set<string>();
    BUILT_IN_PROTOCOL_NAMES.forEach(name => collectPageFeatures(DeveloperProtocols[name], EXPECTED_PAGE_FEATURES, found));

    const missing = EXPECTED_PAGE_FEATURES.filter(feature => !found.has(feature));
    expect(missing).withContext('page-level features missing from every built-in protocol').toEqual([]);
  });

  it('demonstrates every submit-behavior parameter in at least one built-in protocol', () => {
    const found = new Set<string>();
    BUILT_IN_PROTOCOL_NAMES.forEach(name => collectPageFeatures(DeveloperProtocols[name], EXPECTED_SUBMIT_FEATURES, found));

    const missing = EXPECTED_SUBMIT_FEATURES.filter(feature => !found.has(feature));
    expect(missing).withContext('submit-behavior parameters missing from every built-in protocol').toEqual([]);
  });
});
