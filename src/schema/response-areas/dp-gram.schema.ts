import { JSONSchemaType } from 'ajv';
import { DpGramInterface } from '../../app/views/response-area/response-areas/dp-gram/dp-gram-exam/dp-gram-exam.interface';
import { dpoaeCommonSchemaProperties } from './dpoae-common.schema';

export const dpGramSchema: JSONSchemaType<DpGramInterface> = {
  type: 'object',
  properties: {
    ...dpoaeCommonSchemaProperties,
    type: { type: 'string', enum: ['dpGramResponseArea'] },
    f2: { type: 'array', items: { type: 'number' }, minItems: 1, description: 'Explicit list of F2 test frequencies, in Hz.' },
    // TODO: unconfirmed against firmware - name/default placeholder.
    numAverages: { type: 'number', nullable: true, default: 4 },
  },
  required: ['type', 'f2'],
};
