import { JSONSchemaType } from 'ajv';
import { ManualAudiometryResultViewerInterface } from '../../app/views/response-area/response-areas/manual-audiometry/manual-audiometry-result-viewer/manual-audiometry-result-viewer.interface';

export const manualAudiometryResultViewerSchema: JSONSchemaType<ManualAudiometryResultViewerInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    type: { type: 'string', enum: ['manualAudiometryResultViewerResponseArea'] },
    pageIdsToDisplay: { type: 'array', items: { type: 'string', default: '' } },
  },
  required: ['type', 'pageIdsToDisplay'],
};
