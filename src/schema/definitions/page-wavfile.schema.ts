import { JSONSchemaType } from 'ajv';
import { PageWavfileInterface, PageWavfileCalInterface } from '../../app/interfaces/page-definition.interface';
import { CalibrationFilter, Headset, PlaybackMethod, Tablet, WavfileWeighting } from '../../app/utilities/constants';

export const pageWavfileCalSchema: JSONSchemaType<PageWavfileCalInterface> = {
  type: 'object',
  properties: {
    refType: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true },
    calibrationFilter: { type: 'string', enum: Object.values(CalibrationFilter), default: CalibrationFilter.Full, nullable: true },
    scaleFactor: { type: 'number', nullable: true },
    normFactor: { type: 'number', nullable: true },
    realWorldRMSA: { type: 'number', nullable: true },
    realWorldRMSC: { type: 'number', nullable: true },
    realWorldRMSZ: { type: 'number', nullable: true },
    wavRMSZ: { type: 'number', nullable: true },
    wavRMSA: { type: 'number', nullable: true },
    wavRMSC: { type: 'number', nullable: true },
    RMSZ: { type: 'number', nullable: true },
    RMSA: { type: 'number', nullable: true },
    RMSC: { type: 'number', nullable: true },
    _tablet: { type: 'string', enum: Object.values(Tablet), nullable: true },
    _headset: { type: 'string', enum: Object.values(Headset), nullable: true },
  },
  required: [],
};

export const pageWavfileSchema: JSONSchemaType<PageWavfileInterface> = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    cal: { ...pageWavfileCalSchema, nullable: true },
    useCommonRepo: { type: 'boolean', nullable: true, default: false },
    playbackMethod: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true, default: PlaybackMethod.Arbitrary },
    targetSPL: { type: ['number', 'string'], nullable: true, default: 65 },
    weighting: { type: 'string', enum: Object.values(WavfileWeighting), nullable: true, default: WavfileWeighting.Z },
    startTime: { type: 'number', nullable: true, default: 0 },
    endTime: { type: 'number', nullable: true },
    _resolvedPath: { type: 'string', nullable: true },
    _tabletGain: { type: 'number', nullable: true },
  },
  required: ['path'],
};
