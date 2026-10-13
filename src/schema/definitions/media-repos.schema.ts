import { JSONSchemaType } from 'ajv';
import { MediaRepoProtocolTarget, MediaReposInterface } from '../../app/interfaces/media-repos.interface';
import { DeviceType } from '../../app/utilities/constants';

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
    target: { type: 'string', enum: [...Object.values(DeviceType), MediaRepoProtocolTarget] },
  },
  required: ['host', 'repository', 'token', 'group', 'tag', 'date', 'path', 'target'],
};
