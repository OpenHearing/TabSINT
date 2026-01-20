import { JSONSchemaType } from 'ajv';
import { PageWavfileInterface } from '../../app/interfaces/page-definition.interface';
import { PlaybackMethod, WavfileWeighting } from '../../app/utilities/constants';

export const pageWavfileSchema: JSONSchemaType<PageWavfileInterface> = {
  type: 'object',
  properties: {
    path: { type: 'string' },
    cal: { type: 'object', nullable: true },
    useCommonRepo: { type: 'boolean', nullable: true, default: false },
    playbackMethod: { type: 'string', enum: Object.values(PlaybackMethod), nullable: true, default: PlaybackMethod.Arbitrary },
    targetSPL: { type: ['number', 'string'], nullable: true, default: 65 },
    weighting: { type: 'string', enum: Object.values(WavfileWeighting), nullable: true, default: WavfileWeighting.Z },
    startTime: { type: 'number', nullable: true, default: 0 },
    endTime: { type: 'number', nullable: true },
  },
  required: ['path'],
};
