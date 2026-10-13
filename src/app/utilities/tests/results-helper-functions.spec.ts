import { WahtsDevice } from '../../models/devices/wahts-device';
import { DeviceType } from '../constants';
import { constructFilename, displayableDevice, getDateString } from '../results-helper-functions';

describe('results-helper-functions', () => {
  describe('getDateString', () => {
    it('formats a given ISO datetime string', () => {
      const result = getDateString('2024-03-15T10:30:45.000Z');
      expect(result).toBe('2024-03-15T10-30-45');
    });

    it('falls back to a current-date string when no argument is given', () => {
      const result = getDateString(undefined);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe('constructFilename', () => {
    it('uses the device UUID when no resultFilename is provided', () => {
      const result = constructFilename('abc123', undefined, '2024-03-15T10:30:45.000Z');
      expect(result).toBe('abc123.2024-03-15T10-30-45');
    });

    it('uses resultFilename when provided', () => {
      const result = constructFilename('abc123', 'myProtocol', '2024-03-15T10:30:45.000Z');
      expect(result).toBe('myProtocol.2024-03-15T10-30-45');
    });

    it('appends suffix when provided', () => {
      const result = constructFilename('abc123', 'myProtocol', '2024-03-15T10:30:45.000Z', '.json');
      expect(result).toBe('myProtocol.2024-03-15T10-30-45.json');
    });
  });

  describe('displayableDevice', () => {
    it('removes status and state', () => {
      const device = new WahtsDevice('mockId', 'mockName', 'mockTabsintId');
      device.metadata = {};
      const displayDevice = displayableDevice(device);

      expect(Object.keys(displayDevice)).not.toContain('state');
      expect(Object.keys(displayDevice)).not.toContain('status');
    });

    it('contains identifiers and metadata', () => {
      const device = new WahtsDevice('mockId', 'mockName', 'mockTabsintId');
      device.metadata = {};
      const displayDevice = displayableDevice(device);

      expect(Object.keys(displayDevice)).toContain('deviceId');
      expect(Object.keys(displayDevice)).toContain('name');
      expect(Object.keys(displayDevice)).toContain('tabsintId');
      expect(Object.keys(displayDevice)).toContain('type');
      expect(Object.keys(displayDevice)).toContain('metadata');

      expect(displayDevice.deviceId).toEqual('mockId');
      expect(displayDevice.name).toEqual('mockName');
      expect(displayDevice.tabsintId).toEqual('mockTabsintId');
      expect(displayDevice.type).toEqual(DeviceType.Wahts);
      expect(displayDevice.metadata).toEqual({});
    });
  });
});
