import { JSONSchemaType } from 'ajv';
import { UploadSummary } from '../../app/models/disk/disk.interface';
import { ProtocolServer } from '../../app/utilities/constants';

export const uploadSummarySchema: JSONSchemaType<UploadSummary> = {
  type: 'object',
  properties: {
    protocolId: { type: 'string', nullable: true },
    protocolName: { type: 'string' },
    testDateTime: { type: 'string' },
    nResponses: { type: 'number' },
    source: { type: 'string', enum: Object.values(ProtocolServer) },
    uploadedOn: { type: 'string' },
    output: { type: 'string', enum: Object.values(ProtocolServer) },
  },
  required: ['protocolName', 'testDateTime', 'nResponses', 'source', 'uploadedOn', 'output'],
};
