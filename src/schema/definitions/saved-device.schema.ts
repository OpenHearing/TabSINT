import { JSONSchemaType } from 'ajv';
import { SavedDevice } from '../../app/models/disk/disk.interface';
import { BluetoothType, DeviceState, DeviceStatus, DeviceType } from '../../app/utilities/constants';
import { IWahtsDevice } from '../../app/interfaces/devices/wahts-device.interface';
import { ITympanDevice } from '../../app/interfaces/devices/tympan-device.interface';
import { IDeviceMetadata } from '../../app/interfaces/devices/device-metadata.interface';
import { IChaDeviceMetadata } from '../../app/interfaces/devices/cha-device-metadata';
import { IDuodoseDevice } from '../../app/interfaces/devices/duodose-device.interface';
import { ISvantekDevice } from '../../app/interfaces/devices/svantek-device.interface';

/**
 * Schema for device metadata used by device schemas.
 */
const deviceMetadataSchema: JSONSchemaType<IDeviceMetadata> = {
  type: 'object',
  properties: {
    description: { type: 'string', nullable: true },
    uuid: { type: 'string', nullable: true },
    buildDateTime: { type: 'string', nullable: true },
    serialNumber: { type: 'string', nullable: true },
    build: { type: 'string', nullable: true },
    version: { type: 'string', nullable: true },
    platform: { type: 'string', nullable: true },
    model: { type: 'string', nullable: true },
    os: { type: 'string', nullable: true },
    diskSpace: { type: 'string', nullable: true },
    other: { type: 'string', nullable: true },
  },
  required: [],
};

/**
 * Schema for WAHTS device metadata.
 */
const chaDeviceMetadataSchema: JSONSchemaType<IChaDeviceMetadata> = {
  type: 'object',
  properties: {
    description: { type: 'string', nullable: true },
    uuid: { type: 'string', nullable: true },
    buildDateTime: { type: 'string', nullable: true },
    serialNumber: { type: 'string', nullable: true },
    build: { type: 'string', nullable: true },
    version: { type: 'string', nullable: true },
    platform: { type: 'string', nullable: true },
    model: { type: 'string', nullable: true },
    os: { type: 'string', nullable: true },
    diskSpace: { type: 'string', nullable: true },
    other: { type: 'string', nullable: true },
    calibrationDate: { type: 'string', nullable: true },
    batteryLevel: { type: 'number', nullable: true },
    autoShutdownTime: { type: 'number', nullable: true },
  },
  required: [],
};

/**
 * Schema for WAHTS device to store as a saved device.
 */
const wahtsDeviceSchema: JSONSchemaType<IWahtsDevice> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string' },
    name: { type: 'string' },
    deviceId: { type: 'string' },
    type: { type: 'string', enum: Object.values(DeviceType) },
    msgId: { type: 'number' },
    connectionType: { type: 'string', enum: Object.values(BluetoothType) },
    state: { type: 'string', enum: Object.values(DeviceState) },
    status: { type: 'string', enum: Object.values(DeviceStatus) },
    metadata: chaDeviceMetadataSchema,
  },
  required: ['tabsintId', 'name', 'deviceId', 'type', 'msgId', 'connectionType', 'state', 'status', 'metadata'],
};

const duodoseDeviceSchema: JSONSchemaType<IDuodoseDevice> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string' },
    name: { type: 'string' },
    deviceId: { type: 'string' },
    type: { type: 'string', enum: Object.values(DeviceType) },
    msgId: { type: 'number' },
    connectionType: { type: 'string', enum: Object.values(BluetoothType) },
    state: { type: 'string', enum: Object.values(DeviceState) },
    status: { type: 'string', enum: Object.values(DeviceStatus) },
    metadata: chaDeviceMetadataSchema,
  },
  required: ['tabsintId', 'name', 'deviceId', 'type', 'msgId', 'connectionType', 'state', 'status', 'metadata'],
};

/**
 * Schema for Tympan device to store as a saved device.
 */
const tympanDeviceSchema: JSONSchemaType<ITympanDevice> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string' },
    name: { type: 'string' },
    deviceId: { type: 'string' },
    type: { type: 'string', enum: Object.values(DeviceType) },
    msgId: { type: 'number' },
    maxByteLength: { type: 'number' },
    state: { type: 'string', enum: Object.values(DeviceState) },
    status: { type: 'string', enum: Object.values(DeviceStatus) },
    metadata: deviceMetadataSchema,
  },
  required: ['tabsintId', 'name', 'deviceId', 'type', 'msgId', 'maxByteLength', 'state', 'status', 'metadata'],
};

/**
 * Schema for Svantek device to store as a saved device.
 */
const svantekDeviceSchema: JSONSchemaType<ISvantekDevice> = {
  type: 'object',
  properties: {
    tabsintId: { type: 'string' },
    name: { type: 'string' },
    deviceId: { type: 'string' },
    type: { type: 'string', enum: Object.values(DeviceType) },
    state: { type: 'string', enum: Object.values(DeviceState) },
    status: { type: 'string', enum: Object.values(DeviceStatus) },
    metadata: deviceMetadataSchema,
  },
  required: ['tabsintId', 'name', 'deviceId', 'type', 'state', 'status', 'metadata'],
};

/**
 * Saved device schema which can be any of the available devices.
 */
export const savedDeviceSchema: JSONSchemaType<SavedDevice> = {
  anyOf: [wahtsDeviceSchema, tympanDeviceSchema, duodoseDeviceSchema, svantekDeviceSchema],
};
