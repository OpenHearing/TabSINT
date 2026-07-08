import { JSONSchemaType } from 'ajv';
import { LikertInterface, LikertQuestion, LikertSpecifier } from '../../app/views/response-area/response-areas/likert/likert/likert.interface';

const specifierSchema: JSONSchemaType<LikertSpecifier> = {
  type: 'object',
  properties: {
    level: { type: 'number', multipleOf: 1, description: 'Which level (0-based) this label is pinned to.' },
    label: { type: 'string', description: 'The label text.' },
    position: {
      type: 'string',
      enum: ['above', 'below'],
      description: 'Whether this label sits above or below the scale. Defaults to above.',
      nullable: true,
    },
  },
  required: ['level', 'label'],
};

const questionSchema: JSONSchemaType<LikertQuestion> = {
  type: 'object',
  description: 'A single Likert question. Any field left out falls back to the response-area value.',
  properties: {
    text: { type: 'string', description: 'Question prompt. May contain HTML.', nullable: true },
    levels: { type: 'number', multipleOf: 1, description: 'Override number of levels for this question.', nullable: true },
    labels: { type: 'array', items: { type: 'string' }, description: 'Override labels for this question.', nullable: true },
    specifiers: { type: 'array', items: specifierSchema, description: 'Per-level labels for this question.', nullable: true },
    position: { type: 'string', enum: ['above', 'below'], nullable: true },
    centerLabelAbove: { type: 'string', nullable: true },
    centerLabelBelow: { type: 'string', nullable: true },
    labelFontSize: { type: 'number', description: 'Label font size in px.', nullable: true },
    questionFontSize: { type: 'number', description: 'Question font size in px.', nullable: true },
    useEmoticons: { type: 'boolean', nullable: true },
  },
  required: [],
};

export const likertSchema: JSONSchemaType<LikertInterface> = {
  type: 'object',
  description: 'A Likert scale answer, with optional specifiers for some or all of the points.',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['likertResponseArea'] },
    useEmoticons: {
      type: 'boolean',
      description: 'If true, use emoticons instead of numbers. Requires levels == 5',
      nullable: true,
      default: false,
    },
    useRadioButtons: {
      type: 'boolean',
      description: 'If true, show radio buttons instead of numbers for each level.',
      nullable: true,
      default: false,
    },
    levels: {
      type: 'number',
      multipleOf: 1,
      description: 'How many levels? E.g., if levels==3, then there are three choices: 0, 1, and 2.',
      default: 10,
      nullable: true,
    },
    labels: {
      type: 'array',
      description:
        'Description of the Likert scale. Length equal to levels displays a label with each option; length 2 places the first label at the left end and the second at the right end. Positioned by `position`, and combined with `specifiers`.',
      items: { type: 'string', description: 'Words describing each level.' },
      nullable: true,
    },
    specifiers: {
      type: 'array',
      description:
        'Per-level labels as objects { level, label, position? }, each positioned above or below the scale (default above). Combined with labels — put the two on opposite sides to show descriptive text on one side and numbers on the other.',
      items: specifierSchema,
      nullable: true,
    },
    position: {
      type: 'string',
      enum: ['above', 'below'],
      description:
        'Where the labels array is placed (above or below the scale). Does not affect specifiers, which carry their own per-item position.',
      nullable: true,
      default: 'above',
    },
    centerLabelAbove: {
      type: 'string',
      description: 'A single label centered above the whole scale, applying to all questions.',
      nullable: true,
    },
    centerLabelBelow: {
      type: 'string',
      description: 'A single label centered below the whole scale, applying to all questions.',
      nullable: true,
    },
    labelFontSize: { type: 'number', description: 'Override the label font size, in px.', nullable: true },
    questionFontSize: { type: 'number', description: 'Override the question text font size, in px.', nullable: true },
    questions: {
      type: 'array',
      description:
        'Questions being asked. Each item is either a plain string (shares the response-area settings) or an object with per-question overrides. If only one, page-level instruction text can be used instead.',
      items: {
        anyOf: [{ type: 'string' }, questionSchema],
      } as unknown as JSONSchemaType<string | LikertQuestion>,
      nullable: true,
    },
    useSlider: {
      type: 'boolean',
      description: 'If true, use a slider to 1 decimal accuracy to record the answer.',
      nullable: true,
      default: false,
    },
    naBox: {
      type: 'boolean',
      description: "If true, use a 'Not Applicable' checkbox.",
      nullable: true,
      default: false,
    },
    autoSubmit: { type: 'boolean', nullable: true, default: false },
    verticalSpacing: {
      type: 'number',
      description: 'Vertical gap (in px) between questions on the page.',
      nullable: true,
      default: 20,
    },
  },
  required: ['type'],
};
