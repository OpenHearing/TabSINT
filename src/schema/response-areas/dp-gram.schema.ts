import { JSONSchemaType } from 'ajv';
import { DpGramInterface } from '../../app/views/response-area/response-areas/dp-gram/dp-gram-exam/dp-gram-exam.interface';
import { dpoaeCommonSchemaProperties } from './dpoae-common.schema';

export const dpGramSchema: JSONSchemaType<DpGramInterface> = {
  type: 'object',
  properties: {
    ...dpoaeCommonSchemaProperties,
    type: { type: 'string', enum: ['dpGramResponseArea'] },
    f2: { type: 'array', items: { type: 'number' }, minItems: 1, description: 'Explicit list of F2 test frequencies, in Hz.' },
    windowDuration: { type: 'number', nullable: true, default: 1.0, description: 'Span of analysis windows for least-squares fit. In seconds.' },
    minTestAverages: { type: 'number', nullable: true, default: 1, description: 'Minimum number of overlapping analysis windows averaged per f2 frequency.' },
    maxTestAverages: { type: 'number', nullable: true, default: 1, description: 'Maximum number of overlapping analysis windows averaged per f2 frequency.' },
  },
  required: ['type', 'f2'],
};
