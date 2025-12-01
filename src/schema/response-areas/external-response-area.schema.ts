import { JSONSchemaType } from 'ajv';
import { ExternalResponseAreaInterface } from '../../app/views/response-area/response-areas/external-response-area/external-response-area.interface';

export const externalResponseAreaSchema: JSONSchemaType<ExternalResponseAreaInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    showResults: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['externalResponseArea'] },
    htmlFilePath: { type: 'string', nullable: true },
    jsFilePath: { type: 'string', nullable: true },
    html: { type: 'string', nullable: true },
    js: { type: 'string', nullable: true },
  },
  required: ['type'],
};
