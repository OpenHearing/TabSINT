import { JSONSchemaType } from 'ajv';
import { SubjectIdInterface } from '../../app/views/response-area/response-areas/subject-id/subject-id.interface';

export const subjectIdSchema: JSONSchemaType<SubjectIdInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['subjectIdResponseArea'] },
    generate: { type: 'boolean', default: false },
    exportToCSV: { type: 'boolean', nullable: true, default: false },
  },
  required: ['type'],
};
