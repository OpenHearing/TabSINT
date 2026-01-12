import { JSONSchemaType } from 'ajv';
import { navMenuSchema } from './definitions/navMenu.schema';
import { wavfileSchema } from './definitions/wavfile.schema';
import { followOnSchema } from './definitions/follow-on.schema';
import { setFlagSchema } from './definitions/set-flag.schema';
import { PageDefinition } from '../app/interfaces/page-definition.interface';
import { chaWavFileSchema } from './definitions/cha-wavfile.schema';
import { textBoxResultViewerSchema, textBoxSchema } from './response-areas/textbox.schema';
import { multipleChoiceSchema } from './response-areas/multiple-choice.schema';
import { manualAudiometrySchema } from './response-areas/manual-audiometry.schema';
import { calibrationExamSchema } from './response-areas/calibration-exam.schema';
import { FPLcalibrationExamSchema } from './response-areas/fpl-calibration-exam.schema';
import { multipleInputSchema } from './response-areas/multiple-input.schema';
import { likertSchema } from './response-areas/likert.schema';
import { sweptDpoaeSchema } from './response-areas/swept-dpoae.schema';
import { waiSchema } from './response-areas/wai.schema';
import { mrtSchema } from './response-areas/mrt.schema';
import { memrSchema } from './response-areas/memr.schema';
import { CustomResponseAreaSchema } from './response-areas/external-response-area.schema';
import { subjectIdSchema } from './response-areas/subject-id.schema';
import { checkboxSchema } from './response-areas/checkbox.schema';

export const pageSchema: JSONSchemaType<PageDefinition> = {
  $id: 'page_base',
  type: 'object',
  properties: {
    id: { type: 'string' },
    headset: {
      type: 'string',
      enum: ['None', 'VicFirth', 'Vic Firth S2', 'HDA200', 'WAHTS', 'Audiometer', 'EPHD1'],
      nullable: true,
    },
    skipIf: { type: 'string', nullable: true },
    hideProgressBar: { type: 'boolean', nullable: true, default: false },
    autoSubmitDelay: { type: 'number', nullable: true, minimum: 50 },
    isAutoSubmit: { type: 'boolean', nullable: true, default: true },
    enableBackButton: { type: 'boolean', nullable: true, default: false },
    navMenu: { type: 'array', items: navMenuSchema, nullable: true },
    title: { type: 'string', nullable: true },
    subtitle: { type: 'string', nullable: true },
    spacing: { type: 'string', nullable: true },
    questionMainText: { type: 'string', nullable: true },
    questionSubText: { type: 'string', nullable: true },
    instructionText: { type: 'string', nullable: true },
    helpText: { type: 'string', nullable: true },
    resultMainText: { type: 'string', nullable: true },
    resultSubText: { type: 'string', nullable: true },
    repeatPage: {
      type: 'object',
      properties: {
        nRepeats: { type: 'number', default: 2 },
        repeatIf: { type: 'string', nullable: true },
      },
      required: ['nRepeats'],
      nullable: true,
    },
    preProcessFunction: { type: 'string', nullable: true },
    wavfileStartDelayTime: { type: 'number', nullable: true, minimum: 0, default: 1000 },
    wavfiles: { type: 'array', items: wavfileSchema, nullable: true },
    chaWavFiles: {
      type: 'array',
      items: chaWavFileSchema,
      minItems: 1,
      maxItems: 2,
      nullable: true,
    },
    chaStream: { type: 'boolean', nullable: true, default: false },
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
        multipleChoiceSchema,
        multipleInputSchema,
        manualAudiometrySchema,
        calibrationExamSchema,
        FPLcalibrationExamSchema,
        likertSchema,
        sweptDpoaeSchema,
        waiSchema,
        mrtSchema,
        memrSchema,
        CustomResponseAreaSchema,
      ],
      required: ['type'],
      nullable: true,
    },
    submitText: { type: 'string', nullable: true },
    followOns: { type: 'array', items: followOnSchema, nullable: true },
    setFlags: { type: 'array', items: setFlagSchema, nullable: true },
  },
  required: ['id'],
  additionalProperties: true,
};
