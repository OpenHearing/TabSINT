import { JSONSchemaType } from 'ajv';
import { ButtonGridInterface } from '../../app/views/response-area/response-areas/button-grid/button-grid.interface';
import { rowSchema } from '../definitions/row.schema';
import { choiceSchema } from '../definitions/choice.schema';

export const buttonGridSchema: JSONSchemaType<ButtonGridInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['buttonGridResponseArea'] },
    feedback: { type: 'string', nullable: true, enum: ['showCorrect', 'gradeResponse'] },
    rows: { type: 'array', items: rowSchema, default: [] },
    verticalSpacing: { type: 'number', nullable: true, default: 1 },
    horizontalSpacing: { type: 'number', nullable: true, default: 1 },
    delayEnable: { type: 'number', nullable: true, default: 0 },
    choices: { type: 'array', items: choiceSchema, nullable: true },
  },
  required: ['type', 'rows'],
};
