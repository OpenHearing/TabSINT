import { JSONSchemaType } from 'ajv';
import { ResultsViewResponseAreaInterface } from '../../app/views/response-area/response-areas/results-view/results-view.interface';

export const resultsViewSchema: JSONSchemaType<ResultsViewResponseAreaInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['resultsViewResponseArea'] },
    pageIdsToDisplay: { type: 'array', items: { type: 'string', default: '' } },
  },
  required: ['type', 'pageIdsToDisplay'],
};
