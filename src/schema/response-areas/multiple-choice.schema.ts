import { JSONSchemaType } from 'ajv';
import { MultipleChoiceInterface } from '../../app/views/response-area/response-areas/multiple-choice/multiple-choice.interface';
import { choiceSchema } from '../definitions/choice.schema';

export const multipleChoiceSchema: JSONSchemaType<MultipleChoiceInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['multipleChoiceResponseArea'] },
    choices: { type: 'array', nullable: true, items: choiceSchema },
    other: { type: 'string', nullable: true },
    verticalSpacing: { type: 'number', nullable: true, default: 1 },
    delayEnable: { type: 'number', nullable: true, default: 0 },
    feedback: { type: 'string', enum: ['gradeResponse', 'showCorrect'], nullable: true },
    autoSubmit: {
      type: 'boolean',
      nullable: true,
      default: true,
      description: 'Submit the page as soon as a choice is selected, instead of waiting for the submit button.',
    },
  },
  required: ['type'],
};
