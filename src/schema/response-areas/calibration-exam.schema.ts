import { JSONSchemaType } from 'ajv';
import { CalibrationExamInterface } from '../../app/views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.interface';

export const calibrationExamSchema: JSONSchemaType<CalibrationExamInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    showResults: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['calibrationResponseArea'] },
    tabsintId: { type: 'string', nullable: true },
    frequencies: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
    },
    targetLevels: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
    },
    batchFrequencies: {
      type: 'boolean',
      description:
        'Whether frequencies should be grouped during the exam. If true, calibration and measurement are done for all frequencies before moving on to max output. Otherwise calibration, measurement and max output are done for a single frequency before moving on to the next frequency',
      nullable: true,
      default: false,
    },
  },
  required: ['type'],
};
