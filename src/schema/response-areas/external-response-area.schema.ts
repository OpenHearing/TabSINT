import { JSONSchemaType } from 'ajv';
import { CustomResponseAreaInterface } from '../../app/views/response-area/response-areas/custom-response-area/custom-response-area.interface';

export const CustomResponseAreaSchema: JSONSchemaType<CustomResponseAreaInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    showResults: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['customResponseArea'] },
    htmlFilePath: { type: 'string', nullable: true },
    jsFilePath: { type: 'string', nullable: true },
    html: { type: 'string', nullable: true },
    js: { type: 'string', nullable: true },
  },
  required: ['type'],
};
