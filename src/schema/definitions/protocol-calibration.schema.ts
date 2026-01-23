import { JSONSchemaType } from 'ajv';
import { CalibrationResultViewerInterface } from '../../app/views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.interface';
import { CalibrationFilter } from '../../app/utilities/constants';
import { ProtocolCalibrationInterface } from '../../app/interfaces/protocol-schema.interface';

export const protocolCalibrationSchema: JSONSchemaType<ProtocolCalibrationInterface> = {
  type: 'object',
  properties: {
    wavfiles: { type: 'array', items: { type: 'string' } },
    referenceFile: { type: 'string', nullable: true },
    referenceLevel: { type: 'number', nullable: true },
    calibrationFilter: { type: 'string', enum: Object.values(CalibrationFilter), default: CalibrationFilter.Full, nullable: true },
  },
  required: ['wavfiles'],
};

export const calibrationResultViewerSchema: JSONSchemaType<CalibrationResultViewerInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['calibrationResponseAreaResultViewer'] },
    displayRightEar: { type: 'boolean', default: false },
    displayLeftEar: { type: 'boolean', default: false },
  },
  required: ['type'],
};
