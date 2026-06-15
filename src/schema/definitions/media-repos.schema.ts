import { JSONSchemaType } from 'ajv';
import { MediaReposInterface } from '../../app/interfaces/media-repos.interface';

export const mediaReposSchema: JSONSchemaType<MediaReposInterface> = {
  type: 'object',
  properties: {
    host: { type: 'string' },
    repository: { type: 'string' },
    token: { type: 'string' },
    group: { type: 'string' },
    tag: { type: 'string' },
    date: { type: 'string' },
    path: { type: 'string' },
  },
  required: ['host', 'repository', 'token', 'group', 'tag', 'date', 'path'],
};
