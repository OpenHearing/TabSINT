import { JSONSchemaType } from 'ajv';
import { DuodoseDownloadInterface } from '../../app/views/response-area/response-areas/duodose-download/duodose-download.interface';

export const duodoseDownloadSchema: JSONSchemaType<DuodoseDownloadInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['duodoseDownloadResponseArea'] },
    tabsintId: { type: 'string', nullable: true },
  },
  required: ['type'],
};
