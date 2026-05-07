import { JSONSchemaType } from 'ajv';
import { ChaWavfilesInterface } from '../../app/interfaces/page-definition.interface';

export const chaWavFilesSchema: JSONSchemaType<ChaWavfilesInterface> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string', nullable: true },
    useMetaRMS: { type: 'boolean', nullable: true, default: false },
    UseMetaRMS: { type: 'boolean', nullable: true },
    wavfiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          Leq: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 4,
            nullable: true,
            default: [72, 72],
          },
          SoundFileName: { type: 'string', nullable: true },
          _resolvedPath: { type: 'string', nullable: true },
        },
        required: ['path'],
      },
      minItems: 1,
      maxItems: 2,
    },
  },
  nullable: true,
  required: ['wavfiles'],
};
