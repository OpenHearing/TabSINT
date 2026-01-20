import { JSONSchemaType } from 'ajv';
import { MediaReposInterface } from '../../app/interfaces/media-repos.interface';

export const mediaReposSchema: JSONSchemaType<MediaReposInterface> = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    date: { type: 'string' },
    version: { type: 'string' },
    path: { type: 'string' },
  },
  required: ['name', 'date', 'version', 'path'],
};
