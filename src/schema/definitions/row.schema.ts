import { JSONSchemaType } from 'ajv';
import { RowInterface } from '../../app/interfaces/row.interface';
import { choiceSchema } from './choice.schema';

export const rowSchema: JSONSchemaType<RowInterface> = {
  type: 'object',
  properties: {
    choices: {
      type: 'array',
      items: choiceSchema,
    },
  },
  required: ['choices'],
};
