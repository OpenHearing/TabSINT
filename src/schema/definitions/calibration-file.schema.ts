import { JSONSchemaType } from 'ajv';
import { CalibrationFilter, Headset, PlaybackMethod, Tablet } from '../../app/utilities/constants';
import { CalibrationFileInterface, CalibrationFileWavProperties } from '../../app/interfaces/calibration-file.interface';

export const CalibrationFileWavPropertiesSchema: JSONSchemaType<CalibrationFileWavProperties> = {
  type: 'object',
  properties: {
    refType: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true },
    calibrationFilter: { type: 'string', enum: Object.values(CalibrationFilter), nullable: true },
    scaleFactor: { type: 'number', nullable: true },
    normFactor: { type: 'number', nullable: true },
    realWorldRMSA: { type: 'number', nullable: true },
    realWorldRMSC: { type: 'number', nullable: true },
    realWorldRMSZ: { type: 'number', nullable: true },
    wavRMSA: { type: 'number', nullable: true },
    wavRMSC: { type: 'number', nullable: true },
    wavRMSZ: { type: 'number', nullable: true },
    RMSA: { type: 'number', nullable: true },
    RMSC: { type: 'number', nullable: true },
    RMSZ: { type: 'number', nullable: true },
  },
  required: [],
};

export const calibrationFileSchema: JSONSchemaType<CalibrationFileInterface> = {
  type: 'object',
  properties: {
    headset: { type: 'string', enum: Object.values(Headset) },
    tablet: { type: 'string', enum: Object.values(Tablet) },
    audioProfileVersion: { type: 'string' },
    calibrationPySVNRevision: { type: 'string' },
    calibrationPyManualReleaseDate: { type: ['string', 'number'] },
  },
  required: ['headset', 'tablet', 'audioProfileVersion', 'calibrationPySVNRevision', 'calibrationPyManualReleaseDate'],
  additionalProperties: CalibrationFileWavPropertiesSchema,
};
