import { JSONSchemaType } from 'ajv';
import { ProtocolMetaInterface } from '../../app/models/protocol/protocol.interface';
import { gitlabConfigSchema } from './gitlab-config.schema';
import { ProtocolServer } from '../../app/utilities/constants';

export const protocolMetaSchema: JSONSchemaType<ProtocolMetaInterface> = {
  type: 'object',
  properties: {
    group: { type: 'string', nullable: true },
    name: { type: 'string', default: '' },
    path: { type: 'string', nullable: true },
    date: { type: 'string', default: '' },
    version: { type: 'string', default: '' },
    creator: { type: 'string', nullable: true },
    server: { type: 'string', enum: Object.values(ProtocolServer), default: ProtocolServer.LocalServer },
    admin: { type: 'boolean', default: false },
    contentURI: { type: 'string', nullable: true },
    gitlabConfig: {
      ...gitlabConfigSchema,
      nullable: true,
    },
    publicKey: { type: 'string', nullable: true },
  },
  required: ['name', 'date', 'version', 'server', 'admin'],
};
