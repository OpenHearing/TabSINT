import { JSONSchemaType } from 'ajv';
import { CheckboxInterface } from '../../app/views/response-area/response-areas/checkbox/checkbox.interface';
import { choiceSchema } from '../definitions/choice.schema';

export const checkboxSchema: JSONSchemaType<CheckboxInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['checkboxResponseArea'] },
    choices: { type: 'array', items: choiceSchema },
    buttonScheme: { type: 'string', nullable: true, enum: ['markCorrect', 'markIncorrect'] },
    feedback: { type: 'string', nullable: true, enum: ['showCorrect', 'gradeResponse'] },
    other: { type: 'string', nullable: true },
    verticalSpacing: { type: 'number', nullable: true, default: 1 },
    exportToCSV: { type: 'boolean', nullable: true, default: false },
  },
  required: ['type', 'choices'],
};
