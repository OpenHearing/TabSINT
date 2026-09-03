import { JSONSchemaType } from 'ajv';
import { navMenuSchema } from './definitions/navMenu.schema';
import { pageWavfileSchema } from './definitions/page-wavfile.schema';
import { followOnSchema } from './definitions/follow-on.schema';
import { setFlagSchema } from './definitions/set-flag.schema';
import { PageDefinition } from '../app/interfaces/page-definition.interface';
import { chaWavFilesSchema } from './definitions/cha-wavfile.schema';
import { textBoxResultViewerSchema, textBoxSchema } from './response-areas/textbox.schema';
import { multipleChoiceSchema } from './response-areas/multiple-choice.schema';
import { manualAudiometrySchema } from './response-areas/manual-audiometry.schema';
import { calibrationExamSchema } from './response-areas/calibration-exam.schema';
import { FPLcalibrationExamSchema } from './response-areas/fpl-calibration-exam.schema';
import { multipleInputSchema } from './response-areas/multiple-input.schema';
import { likertSchema } from './response-areas/likert.schema';
import { sweptDpoaeSchema } from './response-areas/swept-dpoae.schema';
import { dpGramSchema } from './response-areas/dp-gram.schema';
import { waiSchema } from './response-areas/wai.schema';
import { mrtSchema } from './response-areas/mrt.schema';
import { memrSchema } from './response-areas/memr.schema';
import { subjectIdSchema } from './response-areas/subject-id.schema';
import { checkboxSchema } from './response-areas/checkbox.schema';
import { CustomResponseAreaSchema } from './response-areas/custom-response-area.schema';
import { buttonGridSchema } from './response-areas/button-grid.schema';
import { qrCodeResponseAreaSchema } from './response-areas/qr-code.schema';
import { duodoseDownloadSchema } from './response-areas/duodose-download.schema';
import { bekesyResponseAreaSchema } from './response-areas/bekesy.schema';
import { threeDigitSchema } from './response-areas/three-digit.schema';
import { hintSchema } from './response-areas/hint.schema';
import { gapSchema } from './response-areas/gap.schema';
import { hughsonWestlakeSchema } from './response-areas/hughson-westlake.schema';
import { bhaftSchema } from './response-areas/bhaft.schema';
import { mpanlSchema } from './response-areas/mpanl.schema';
import { bekesyLikeSchema } from './response-areas/bekesy-like.schema';

export const pageSchema: JSONSchemaType<PageDefinition> = {
  $id: 'page_base',
  type: 'object',
  // A page carrying "reference" is a ProtocolReferenceInterface, not a full page, regardless of
  // whether it also has "id" (see isPageDefinition in type.guard.ts) - excluded here so the two
  // stay distinguishable under oneOf even when both fields are present on one object.
  not: { required: ['reference'] },
  properties: {
    id: { type: 'string' },
    skipIf: { type: 'string', nullable: true },
    autoSubmitDelay: { type: 'number', nullable: true, minimum: 50 },
    enableBackButton: { type: 'boolean', nullable: true, default: false },
    navMenu: { type: 'array', items: navMenuSchema, nullable: true },
    title: { type: 'string', nullable: true },
    subtitle: { type: 'string', nullable: true },
    questionPreMainText: { type: 'string', nullable: true },
    questionMainText: { type: 'string', nullable: true },
    questionSubText: { type: 'string', nullable: true },
    instructionText: { type: 'string', nullable: true },
    helpText: { type: 'string', nullable: true },
    repeatPage: {
      type: 'object',
      properties: {
        nRepeats: { type: 'number', default: 1 },
        repeatIf: { type: 'string', nullable: true },
      },
      required: ['nRepeats'],
      nullable: true,
    },
    preProcessFunction: {
      type: 'object',
      description:
        'A JS file/function to run before this page displays. The function receives no arguments; ' +
        "it may inspect prior results/flags via window.tabsint.resultsModel and override this page's " +
        'variables (instructionText, responseArea config, etc.) by mutating window.tabsint.page directly.',
      properties: {
        filepath: { type: 'string', nullable: false },
        function: { type: 'string', nullable: false },
        js: { type: 'string', nullable: true },
      },
      required: ['filepath', 'function'],
      nullable: true,
    },
    wavfileStartDelayTime: {
      type: 'number',
      description: 'Time delay before wavfiles start playing on the page.',
      default: 1000,
      minimum: 0,
      nullable: true,
    },
    wavfiles: { type: 'array', items: pageWavfileSchema, nullable: true },
    chaWavFiles: { ...chaWavFilesSchema, nullable: true },
    image: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        width: { type: 'string', nullable: true, default: '100%' },
        b64: { type: 'string', nullable: true },
      },
      required: ['path'],
      nullable: true,
    },
    video: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        width: { type: 'string', nullable: true, default: '100%' },
        autoplay: { type: 'boolean', nullable: true, default: false },
        noSkip: { type: 'boolean', nullable: true, default: false },
        _resolvedPath: { type: 'string', nullable: true },
      },
      nullable: true,
      required: ['path'],
    },
    responseArea: {
      type: 'object',
      oneOf: [
        textBoxSchema,
        textBoxResultViewerSchema,
        subjectIdSchema,
        checkboxSchema,
        duodoseDownloadSchema,
        buttonGridSchema,
        multipleChoiceSchema,
        multipleInputSchema,
        manualAudiometrySchema,
        calibrationExamSchema,
        FPLcalibrationExamSchema,
        likertSchema,
        sweptDpoaeSchema,
        dpGramSchema,
        waiSchema,
        mrtSchema,
        memrSchema,
        CustomResponseAreaSchema,
        qrCodeResponseAreaSchema,
        bekesyResponseAreaSchema,
        threeDigitSchema,
        hintSchema,
        gapSchema,
        hughsonWestlakeSchema,
        bhaftSchema,
        mpanlSchema,
        bekesyLikeSchema,
      ],
      required: ['type'],
      nullable: true,
    },
    submitText: { type: 'string', nullable: true },
    followOns: { type: 'array', items: followOnSchema, nullable: true },
    setFlags: { type: 'array', items: setFlagSchema, nullable: true },
    progressBarVal: { type: ['string', 'number'], nullable: true },
    dosimetry: {
      type: 'object',
      properties: {
        tabsintId: { type: 'array', items: { type: 'string' }, default: [], nullable: true },
      },
      nullable: true,
    },
    svantek: { type: 'boolean', nullable: true, default: false },
  },
  required: ['id'],
  additionalProperties: true,
};
