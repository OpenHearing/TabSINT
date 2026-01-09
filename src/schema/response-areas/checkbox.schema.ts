import { JSONSchemaType } from 'ajv';
import { CheckboxChoiceInterface, CheckboxInterface } from '../../app/views/response-area/response-areas/checkbox/checkbox.interface';

export const checkboxChoiceSchema: JSONSchemaType<CheckboxChoiceInterface> = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    text: { type: 'string', nullable: true, default: 'defaults to id if not provided (not yet implemented)' },
    correct: { type: 'boolean', nullable: true, default: false },
    disable: { type: 'boolean', nullable: true, default: false },
    textColor: { type: 'string', nullable: true, default: 'tabsint button text color' },
    backgroundColor: { type: 'string', nullable: true, default: 'tabsint button background color' },
    fontSize: { type: 'string', nullable: true, default: 'tabsint button button text size' },
  },
  required: ['id'],
};

export const checkboxSchema: JSONSchemaType<CheckboxInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['checkboxResponseArea'] },
    choices: { type: 'array', items: checkboxChoiceSchema },
    buttonScheme: { type: 'string', nullable: true, default: 'TODO' },
    other: { type: 'string', nullable: true, default: 'TODO' },
    verticalSpacing: { type: 'number', nullable: true, default: 1 },
    exportToCSV: { type: 'boolean', nullable: true, default: false },
  },
  required: ['type', 'choices'],
};
