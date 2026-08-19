import { JSONSchemaType } from 'ajv';
import { normativeDataSchema } from '../definitions/normative-data.schema';
import { DpoaeCommonInterface } from '../../app/views/response-area/response-areas/shared/dpoae/dpoae-common.interface';

export const dpoaeCommonSchemaProperties: JSONSchemaType<DpoaeCommonInterface>['properties'] = {
  type: { type: 'string' },
  enableSkip: { type: 'boolean', nullable: true, default: false },
  responseRequired: { type: 'boolean', nullable: true, default: false },
  exportToCSV: { type: 'boolean', nullable: true, default: false },
  tabsintId: { type: 'string', nullable: true },
  outputCalibrationType: { type: 'string', nullable: true, default: 'SPL' },
  outputChannel1: { type: 'string', nullable: true, default: 'HPL0' },
  outputChannel2: { type: 'string', nullable: true, default: 'HPR0' },
  inputChannel: { type: 'string', nullable: true, default: 'JACK_AS_MIC' },
  ratio: { type: 'number', nullable: true, default: 1.22, description: 'Ratio of F2 to F1.' },
  l1: { type: 'number', nullable: true, default: 65 },
  l2: { type: 'number', nullable: true, default: 55 },
  noiseFloorThreshold: { type: 'number', nullable: true, default: -10, description: 'Early stopping criterion based on the DPlow noise floor.' },
  SNRThreshold: {
    type: 'number',
    nullable: true,
    default: 10,
    description: 'Early stopping criterion based on the difference between DPlow and the DPlow noise floor.',
  },
  recordFileFolder: { type: 'string', nullable: true, default: undefined, description: 'Directory to store full waveform' },
  outputRawMeasurements: { type: 'boolean', nullable: true, default: false },
  showResults: { type: 'boolean', nullable: true, default: true },
  normativeDataPath: { type: 'string', nullable: true, default: '' },
  normativeData: { type: 'array', items: normativeDataSchema, nullable: true, default: [] },
  autoSubmit: { type: 'boolean', nullable: true, default: false },
};
