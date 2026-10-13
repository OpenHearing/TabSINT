import { DeviceState, DeviceStatus, DeviceType } from '../../utilities/constants';
import { DuodoseDevice } from './duodose-device';

describe('ChaDevice', () => {
  it('initializes with the provided deviceId and name', () => {
    const device = new DuodoseDevice('device-1', 'My Device');
    expect(device.deviceId).toBe('device-1');
    expect(device.name).toBe('My Device');
  });

  it('defaults tabsintId to deviceId when not provided', () => {
    const device = new DuodoseDevice('device-1', 'My Device');
    expect(device.tabsintId).toBe('device-1');
  });

  it('uses the provided tabsintId when given', () => {
    const device = new DuodoseDevice('device-1', 'My Device', 'custom-tabsint-id');
    expect(device.tabsintId).toBe('custom-tabsint-id');
  });

  it('initializes with Disconnected state and Ready status', () => {
    const device = new DuodoseDevice('device-1', 'My Device');
    expect(device.state).toBe(DeviceState.Disconnected);
    expect(device.status).toBe(DeviceStatus.Ready);
  });

  it('sets the correct device type for DuodoseDevice', () => {
    const device = new DuodoseDevice('device-1', 'My Device');
    expect(device.type).toBe(DeviceType.Duodose);
  });
});
