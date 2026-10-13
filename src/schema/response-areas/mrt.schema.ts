import { JSONSchemaType } from 'ajv';
import { MrtExamInterface, MrtTrialInterface } from '../../app/views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';

export const mrtTrialSchema: JSONSchemaType<MrtTrialInterface> = {
  type: 'object',
  properties: {
    filename: { type: 'string' },
    leveldBSpl: { type: 'array', items: { type: 'number' } },
    useMeta: { type: 'boolean' },
    choices: { type: 'array', items: { type: 'string' } },
    answer: { type: 'number' },
    SNR: { type: 'number' },
  },
  required: ['filename', 'leveldBSpl', 'useMeta', 'choices', 'answer', 'SNR'],
};

export const mrtSchema: JSONSchemaType<MrtExamInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['mrtResponseArea'] },
    tabsintId: { type: 'string', nullable: true },
    examDefinitionFilename: { type: 'string' },
    outputChannel: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      nullable: true,
      default: ['HPL0'],
    },
    randomizeTrials: { type: 'boolean', nullable: true, default: false },
    randomizeChoices: { type: 'boolean', nullable: true, default: false },
    trialList: {
      type: 'array',
      items: mrtTrialSchema,
      nullable: true,
    },
    showResults: { type: 'boolean', nullable: true, default: true },
    showFeedback: { type: 'boolean', nullable: true, default: true },
  },
  required: ['type'],
};
