import { JSONSchemaType } from 'ajv';
import { SavedDevices } from '../../app/models/disk/disk.interface';
import { savedDeviceSchema } from './saved-device.schema';

export const savedDevicesSchema: JSONSchemaType<SavedDevices> = {
  type: 'object',
  properties: {
    tympan: { type: 'array', items: savedDeviceSchema, default: [] },
    cha: { type: 'array', items: savedDeviceSchema, default: [] },
    svantek: { type: 'array', items: savedDeviceSchema, default: [] },
  },
  required: ['tympan', 'cha', 'svantek'],
};
