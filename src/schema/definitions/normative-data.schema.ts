import { JSONSchemaType } from 'ajv';
import { NormativeDataInterface } from '../../app/interfaces/normative-data-interface';

export const normativeDataSchema: JSONSchemaType<NormativeDataInterface> = {
  type: 'object',
  properties: {
    x: { type: 'number' },
    yMin: { type: 'number' },
    yMax: { type: 'number' },
  },
  required: ['x', 'yMin', 'yMax'],
};
