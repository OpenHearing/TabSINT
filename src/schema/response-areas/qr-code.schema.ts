import { JSONSchemaType } from 'ajv';
import { QrCodeResponseAreaInterface, QrCodeResponseAreaScope } from '../../app/views/response-area/response-areas/qr-code/qr-code.interface';

/**
 * Schema for the QR code response area.
 */
export const qrCodeResponseAreaSchema: JSONSchemaType<QrCodeResponseAreaInterface> = {
  type: 'object',
  properties: {
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: true },
    type: { type: 'string', enum: ['qrCodeResponseArea'] },
    scope: { type: 'string', enum: Object.values(QrCodeResponseAreaScope), default: QrCodeResponseAreaScope.Exam },
  },
  required: ['type', 'scope'],
};
