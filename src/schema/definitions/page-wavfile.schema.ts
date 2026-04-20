import { JSONSchemaType } from 'ajv';
import { PageWavfileInterface, PageWavfileCalInterface } from '../../app/interfaces/page-definition.interface';
import { PlaybackMethod, WavfileWeighting } from '../../app/utilities/constants';

export const pageWavfileCalSchema: JSONSchemaType<PageWavfileCalInterface> = {
  type: 'object',
  properties: {
    tablet: { type: 'string', nullable: true },
    refType: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true },
    realWorldRMSZ: { type: 'number', nullable: true },
    scaleFactor: { type: 'number', nullable: true },
    wavRMSZ: { type: 'number', nullable: true },
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
  },
  required: ['path'],
};
