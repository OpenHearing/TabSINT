import { JSONSchemaType } from 'ajv';
import { ProtocolSchemaInterface } from '../app/interfaces/protocol-schema.interface';
import { protocolCalibrationSchema } from './definitions/protocol-calibration.schema';
import { navMenuSchema } from './definitions/navMenu.schema';
import { pageSchema } from './page.schema';
import { protocolReferenceSchema } from './definitions/protocol-reference.schema';

const protocolSchemaBase: JSONSchemaType<ProtocolSchemaInterface> = {
  $id: 'schema_base',
  type: 'object',
  properties: {
    description: { type: 'string', nullable: true },
    protocolId: { type: 'string', nullable: true },
    resultFilename: { type: 'string', nullable: true },
    publicKey: { type: 'string', nullable: true },
    title: { type: 'string', nullable: true },
    subtitle: { type: 'string', nullable: true },
    instructionText: { type: 'string', nullable: true },
    helpText: { type: 'string', nullable: true },
    submitText: { type: 'string', nullable: true },
    chaStream: { type: 'boolean', default: false, nullable: true },
    randomization: { type: 'string', enum: ['WithoutReplacement'], nullable: true },
    commonMediaRepository: { type: 'string', nullable: true },
    calibration: { type: 'array', items: protocolCalibrationSchema, nullable: true },
    timeout: {
      type: 'object',
      properties: {
        nMaxSeconds: { type: 'number', nullable: true },
        nMaxPages: { type: 'number', nullable: true },
        showAlert: { type: 'boolean', nullable: true },
      },
      nullable: true,
    },
    hideProgressBar: { type: 'boolean', default: false, nullable: true },
    enableBackButton: { type: 'boolean', default: false, nullable: true },
    navMenu: { type: 'array', items: navMenuSchema, nullable: true },
    pages: {
      oneOf: [
        { type: 'array', items: pageSchema },
        { type: 'array', items: protocolReferenceSchema },
        { type: 'array', items: { type: 'object', $ref: 'schema_base', required: ['pages'] } },
      ],
    },
    subProtocols: {
      type: 'array',
      items: { type: 'object', $ref: 'schema_base', required: ['pages'] }, // Reference to self
      nullable: true,
    },
  },
  required: ['pages'],
  additionalProperties: true,
};

export const protocolSchema: JSONSchemaType<ProtocolSchemaInterface> = protocolSchemaBase;
