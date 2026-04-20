import { JSONSchemaType } from 'ajv';
import { BekesyResponseAreaInterface } from '../../app/views/response-area/response-areas/bekesy/bekesy.interface';
import { AudioChannel, ButtonAlignment } from '../../app/utilities/constants';

export const bekesyResponseAreaSchema: JSONSchemaType<BekesyResponseAreaInterface> = {
  type: 'object',
  description: 'The scheme for a Bekesy response area.',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['bekesyResponseArea'] },
    autoSubmit: { type: 'boolean', nullable: true, default: false },
    enableSubmit: { type: 'boolean', nullable: true, default: false },
    buttonBehavior: { type: 'string', nullable: true, enum: ['lowerOnClick', 'higherOnClick'], default: 'lowerOnClick' },
    saturatedRollOver: { type: 'boolean', nullable: true, default: true },
    lookUpCorrection: {
      type: 'object',
      nullable: true,
      additionalProperties: { type: 'array', items: { type: 'number' }, default: [] },
      default: { 0: [0] },
      propertyNames: {
        type: 'string',
        pattern: '^[0-9]+$',
      },
      required: [],
    },
    channel: { type: 'string', nullable: true, enum: Object.values(AudioChannel), default: AudioChannel.Mono },
    startSPL: {
      type: ['number', 'array'],
      oneOf: [
        { type: 'number' },
        {
          type: 'array',
          items: { type: 'number' },
        },
      ],
      nullable: true,
      default: undefined,
    },
    buttonText: { type: 'string', nullable: true, default: 'Press and Hold' },
    buttonPressedText: { type: 'string', nullable: true, default: 'Press and Hold' },
    buttonReleasedText: { type: 'string', nullable: true, default: 'Press and Hold' },
    buttonAlign: { type: 'string', nullable: true, enum: Object.values(ButtonAlignment), default: ButtonAlignment.Center },
    minTargetLevel: { type: 'number', nullable: true, default: 40 },
    maxTargetLevel: { type: 'number', nullable: true, default: 85 },
    timeout: { type: 'number', nullable: true, default: 180 },
    levelRate: { type: 'number', nullable: true, default: 2 },
    numberReversals: { type: 'number', nullable: true, default: 6 },
  },
  required: ['type'],
};
