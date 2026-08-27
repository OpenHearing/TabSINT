import { JSONSchemaType } from 'ajv';
import { MpanlResponseAreaInterface } from '../../app/views/response-area/response-areas/mpanl/mpanl.interface';

export const mpanlSchema: JSONSchemaType<MpanlResponseAreaInterface> = {
  type: 'object',
  description: 'Measures Maximum Permissible Ambient Noise Levels (MPANL) with a Svantek dosimeter.',
  properties: {
    type: { type: 'string', enum: ['mpanlResponseArea'] },
    enableSkip: { type: 'boolean', nullable: true, default: true },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    tabsintId: {
      type: 'string',
      nullable: true,
      description: 'Tabsint ID of a specific Svantek dosimeter to use. Defaults to any connected Svantek.',
    },
    autoSubmit: { type: 'boolean', nullable: true, default: false, description: 'Go straight to next page once this page is complete.' },
    standard: {
      type: 'string',
      nullable: true,
      enum: ['ANSI S3.1-R2008', 'DoD', 'OSHA'],
      default: 'ANSI S3.1-R2008',
      description: 'The octave band noise limits standard name.',
    },
    durations: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
      default: [3000, 10000],
      description: 'Measurement durations offered as buttons, in milliseconds.',
    },
    F: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
      description: 'Override the array of octave band frequencies to report, in Hz.',
    },
    MPANL: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
      description:
        'Override the maximum permissible ambient noise levels (MPANL) for the standard. Array length must match the number of octave band frequencies.',
    },
    attenuation: {
      type: 'array',
      items: { type: 'number' },
      nullable: true,
      description:
        'Override the headset attenuation (in dB) at the octave band frequencies. Defaults to WAHTS attenuation values. Array length must match the number of octave band frequencies.',
    },
  },
  required: ['type'],
};
