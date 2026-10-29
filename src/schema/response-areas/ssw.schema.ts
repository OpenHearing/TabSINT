import { JSONSchemaType } from 'ajv';
import { SswLanguage, SswResponseAreaInterface } from '../../app/views/response-area/response-areas/ssw/ssw.interface';

export const sswSchema: JSONSchemaType<SswResponseAreaInterface> = {
  type: 'object',
  description: 'CHA - SSW exam',
  properties: {
    type: { type: 'string', enum: ['sswResponseArea'] },
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    tabsintId: { type: 'string', nullable: true },
    autoSubmit: {
      type: 'boolean',
      nullable: true,
      default: false,
      description: 'Go straight to the next page once the exam is complete. When true, the results shown at the end of the exam are skipped.',
    },
    examInstructions: {
      type: 'string',
      nullable: true,
      description: 'Replaces the top-level instruction text on the CHA exam pages (each page after starting page)',
    },
    examProperties: {
      type: 'object',
      nullable: true,
      properties: {
        language: {
          type: 'string',
          nullable: true,
          enum: Object.values(SswLanguage),
          default: SswLanguage.AmericanEnglish,
          description: 'Language of exam material, enumeration order matters as the device expects an integer',
        },
        randomOrder: {
          type: 'integer',
          nullable: true,
          default: 0,
          description: 'If true, presentations are presented in randomized order',
        },
        nPresentations: {
          type: 'integer',
          nullable: true,
          default: 40,
          minimum: 1,
          maximum: 99,
          description: 'Number of presentations in an exam',
        },
        groupedPresentations: {
          type: 'array',
          nullable: true,
          default: [0, 0, 0],
          items: { type: 'integer', description: 'Presentation number for each randomization groupings' },
          description: 'Number of presentations per randomization groupings',
        },
        playCarrier: {
          type: 'integer',
          nullable: true,
          default: 1,
          description: 'If true, the carrier phrase is played prior to the target material',
        },
        playHiss: {
          type: 'integer',
          nullable: true,
          default: 1,
          description: 'If true, HISS.wav is played whenever other WAV files are not being played',
        },
        presentationLevel: {
          type: 'integer',
          nullable: true,
          default: 65,
          minimum: 0,
          maximum: 85,
          description: 'Absolute target playback level.',
        },
        firstEar: {
          type: 'integer',
          nullable: true,
          default: 1,
          enum: [0, 1, 2],
          description: 'First Ear of first presentation | 0 = left ear | 1 = right ear | 2 = randomly select left or right',
        },
        waitDur: {
          type: 'number',
          nullable: true,
          default: 0.5,
          minimum: 0,
          maximum: 4,
          description: 'Number of seconds to wait here and there.',
        },
      },
      required: [],
    },
  },
  required: ['type'],
};
