import { JSONSchemaType } from 'ajv';
import { Headset, PlaybackMethod } from '../../app/utilities/constants';
import { CalibrationFileInterface, CalibrationFileWavProperties } from '../../app/interfaces/calibration-file.interface';

export const CalibrationFileWavPropertiesSchema: JSONSchemaType<CalibrationFileWavProperties> = {
  type: 'object',
  properties: {
    refType: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true },
    realWorldRMSZ: { type: 'number', nullable: true },
    scaleFactor: { type: 'number', nullable: true },
    wavRMSZ: { type: 'number', nullable: true },
  },
  required: [],
};

export const calibrationFileSchema: JSONSchemaType<CalibrationFileInterface> = {
  type: 'object',
  properties: {
    headset: { type: 'string', enum: Object.values(Headset) },
    tablet: { type: 'string' },
    audioProfileVersion: { type: 'string' },
    calibrationPySVNRevision: { type: 'string' },
    calibrationPyManualReleaseDate: { type: ['string', 'number'] },
  },
  required: ['headset', 'tablet', 'audioProfileVersion', 'calibrationPySVNRevision', 'calibrationPyManualReleaseDate'],
  additionalProperties: CalibrationFileWavPropertiesSchema,
};
