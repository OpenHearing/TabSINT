import { JSONSchemaType } from 'ajv';
import { SavedDevice } from '../../app/models/disk/disk.interface';

export const savedDeviceSchema: JSONSchemaType<SavedDevice> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string' },
    name: { type: 'string' },
    deviceId: { type: 'string' },
    maxByteLength: { type: 'number' },
  },
  required: ['tabsintId', 'name', 'deviceId', 'maxByteLength'],
};
