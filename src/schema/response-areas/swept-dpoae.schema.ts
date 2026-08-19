import { JSONSchemaType } from 'ajv';
import { SweptDpoaeInterface } from '../../app/views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface';
import { dpoaeCommonSchemaProperties } from './dpoae-common.schema';

export const sweptDpoaeSchema: JSONSchemaType<SweptDpoaeInterface> = {
  type: 'object',
  properties: {
    ...dpoaeCommonSchemaProperties,
    type: { type: 'string', enum: ['sweptDPOAEResponseArea'] },
    f2Start: { type: 'number', nullable: true, default: 1000 },
    f2End: { type: 'number', nullable: true, default: 8000 },
    sweepDuration: { type: 'number', nullable: true, default: 6, description: 'Duration of sweep, not including start and end ramps. In seconds.' },
    sweepType: { type: 'string', enum: ['log', 'linear'], nullable: true, default: 'log' },
    minSweeps: { type: 'number', nullable: true, default: 16 },
    maxSweeps: { type: 'number', nullable: true, default: 32 },
    windowDuration: { type: 'number', nullable: true, default: 0.125, description: 'Span of analysis windows for least-squares fit. In seconds.' },
    numFrequencies: {
      type: 'number',
      nullable: true,
      default: 128,
      description:
        'Number of frequencies in the returned data. Spaced across the range of F2, F1, and Fdp values in the sweep. Frequencies are spaced using the same function as the SweepType.',
    },
  },
  required: ['type'],
};
