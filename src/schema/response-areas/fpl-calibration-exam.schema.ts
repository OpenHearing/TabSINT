import { JSONSchemaType } from 'ajv';
import { FPLCalibrationExamInterface } from '../../app/views/response-area/response-areas/fpl-calibration-exam/fpl-calibration-exam-component/fpl-calibration-exam.interface';

export const FPLcalibrationExamSchema: JSONSchemaType<FPLCalibrationExamInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    showResults: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['fplCalibrationResponseArea'] },
    tabsintId: { type: 'string', nullable: true },
    recordFileFolder: { type: 'string', nullable: true, default: undefined, description: 'Directory to store full waveform' },
    outputChannels: { type: 'array', nullable: false, items: { type: 'string' } },
    fStart: { type: 'number', nullable: true, default: 390 },
    fEnd: { type: 'number', nullable: true, default: 16500 },
    sweepDuration: { type: 'number', nullable: true, default: 6, description: 'Duration of sweep, not including start and end ramps. In seconds.' },
    windowDuration: {
      type: 'number',
      nullable: true,
      default: 0.1,
      description: 'Duration of sweep, not including start and end ramps. In seconds.',
    },
    numFrequencies: { type: 'number', nullable: true, default: 64 },
    numSweeps: { type: 'number', nullable: true, default: 10 },
  },
  required: ['type'],
};
