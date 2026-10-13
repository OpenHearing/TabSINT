import { JSONSchemaType } from 'ajv';
import { SetFlagInterface } from '../../app/interfaces/page-definition.interface';

export const setFlagSchema: JSONSchemaType<SetFlagInterface> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    conditional: { type: 'string' },
    value: {
      type: ['boolean', 'number', 'string'],
      nullable: true,
    } as unknown as JSONSchemaType<SetFlagInterface>['properties']['value'],
  },
  required: ['id', 'conditional'],
};
