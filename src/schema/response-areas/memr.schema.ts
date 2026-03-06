import { JSONSchemaType } from 'ajv';
import { MemrExamInterface } from '../../app/views/response-area/response-areas/memr/memr-exam/memr-exam.interface';

export const memrSchema: JSONSchemaType<MemrExamInterface> = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['memrResponseArea'] },
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    exportToCSV: { type: 'boolean', nullable: true, default: false },
    tabsintId: { type: 'string', nullable: true, default: '1' },
    soundFileName: { type: 'string', nullable: true },
    recordFileFolder: { type: 'string', nullable: true, default: 'memr', description: 'Directory to store full waveform' },
    nRepeats: { type: 'number', nullable: true },
    useMetaRMS: { type: 'boolean', nullable: true, default: false },
    elicitorLevelChange: { type: 'string', nullable: true, enum: ['Within Block', 'Between Blocks'] },
    elicitorLevelArray: {
      type: 'array',
      items: {
        type: 'number',
      },
      minItems: 0,
      nullable: true,
    },
    probeStimulusLevel: { type: 'number', nullable: true },
    submissionIntervalMs: { type: 'number', nullable: true },
    probeOutputChannel: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      nullable: true,
      default: ['HPR1'],
    },
    elicitorOutputChannel: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      nullable: true,
      default: ['HPL1'],
    },
    recordChannels: {
      type: 'array',
      items: {
        type: 'string',
      },
      minItems: 1,
      nullable: true,
      default: ['EPSHIELD_LEFT_PDM_MIC1', 'EPSHIELD_RIGHT_PDM_MIC1'], // firmware currently supports only 2 channels as of 10_13_2025
      // default: ["EPSHIELD_RIGHT_PDM_MIC1", "EPSHIELD_RIGHT_PDM_MIC2", "EPSHIELD_LEFT_PDM_MIC1", "EPSHIELD_LEFT_PDM_MIC2"],
      description:
        'Channels recorded to a wavefile, typically these can are input channels but can also be output channels. Defaults are designed for Auren probe, for testing without a Tympan Shield, use: ["LEFT:BOARD_MIC", "LEFT:JACK_AS_LINEIN", "HPL0", "HPR0"]',
    },
    bleDelayPerTrial: { type: 'number', nullable: true, default: 4000 },
    autoSubmit: { type: 'boolean', nullable: true, default: false },
  },
  required: ['type'],
};
