import { JSONSchemaType } from 'ajv';
import { GitlabConfigInterface } from '../../app/models/disk/disk.interface';

export const gitlabConfigSchema: JSONSchemaType<GitlabConfigInterface> = {
  type: 'object',
  properties: {
    repository: { type: 'string', default: '' },
    tag: { type: 'string', default: '' },
    host: { type: 'string', default: 'https://gitlab.com/' },
    token: { type: 'string', default: '' },
    group: { type: 'string', default: '' },
  },
  required: ['repository', 'tag', 'host', 'token', 'group'],
};
