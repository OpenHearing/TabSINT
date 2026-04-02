import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Logger } from '../logger.service';
import { DevicesService } from '../devices/devices.service';
import { StateModel } from '../../models/state/state.service';
import { Notifications } from '../notifications.service';
import { SavedDevice } from '../../models/disk/disk.interface';
import { Tasks } from '../tasks.service';
import { DiskModel } from '../../models/disk/disk.service';
import { firstValueFrom, of } from 'rxjs';
import { DeviceType } from '../../utilities/constants';
import { SqLite } from '../sqLite.service';
import { AppModel } from '../../models/app/app.service';
import { TympanDevice } from '../../models/devices/tympan-device';

describe('deviceService', () => {
  let mockNotifications: jasmine.SpyObj<Notifications>;
  let mockMatDialog: jasmine.SpyObj<MatDialog>;
  let mockTasks: jasmine.SpyObj<Tasks>;
  let diskModel: DiskModel;
  let devicesService: DevicesService;
  let savedDevice: SavedDevice;

  beforeEach(async () => {
    mockNotifications = jasmine.createSpyObj('Notifications', ['alert']);
    mockNotifications.alert.and.returnValue(of('OK'));
    mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockTasks = jasmine.createSpyObj('Tasks', ['_dummyMethod']);

    TestBed.configureTestingModule({
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        AppModel,
        SqLite,
        DiskModel,
        StateModel,
        Notifications,
        Logger,
        { provide: MatDialog, useValue: mockMatDialog },
        { provide: Notifications, useValue: mockNotifications },
        { provide: Tasks, useValue: mockTasks },
      ],
    });
    diskModel = TestBed.inject(DiskModel);
    devicesService = TestBed.inject(DevicesService);
    savedDevice = new TympanDevice('UID', 'Device Name', '1');
  });

  it('adding new saved device', async () => {
    await devicesService.saveDevice(savedDevice);
    expect(diskModel.disk.savedDevices.length).toEqual(1);
    expect(diskModel.disk.savedDevices[0]).toEqual(jasmine.objectContaining(savedDevice));
  });

  it('removing saved devices', async () => {
    // @ts-expect-error - Private method access
    const tympanManager = devicesService.managerRegistry[DeviceType.Tympan];
    const device = new TympanDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId);
    tympanManager.addDevice(device);

    await devicesService.saveDevice(savedDevice);
    expect(diskModel.disk.savedDevices.length).toEqual(1);
    expect(diskModel.disk.savedDevices[0]).toEqual(jasmine.objectContaining(savedDevice));

    await devicesService.removeSavedDevice(device);
    expect(diskModel.disk.savedDevices).toEqual([]);
  });

  it('getting device from TabSINT identifier', async () => {
    // @ts-expect-error - Private method access
    const tympanManager = devicesService.managerRegistry[DeviceType.Tympan];
    tympanManager.addDevice(new TympanDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId));
    const device = await devicesService.getDeviceOrDefault(savedDevice.tabsintId, [DeviceType.Tympan]);
    expect(device?.deviceId).toEqual(savedDevice.deviceId);
  });

  it('setting TabSINT identifier to available value', async () => {
    // @ts-expect-error - Private method access
    const tympanManager = devicesService.managerRegistry[DeviceType.Tympan];
    tympanManager.addDevice(new TympanDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId));

    const devices = await firstValueFrom(devicesService.devices);
    const device = devices.find(device => device.deviceId == savedDevice.deviceId);
    expect(device).toBeDefined();

    const newId = 'New ID';
    if (device) {
      await devicesService.setTabsintId(device, newId);
    }

    const updatedDevices = await firstValueFrom(devicesService.devices);
    const updatedDevice = updatedDevices.find(device => device.deviceId == savedDevice.deviceId);
    expect(updatedDevice?.tabsintId).toEqual(newId);
  });

  it('setting TabSINT identifier id to unavailable value', async () => {
    // @ts-expect-error - Private method access
    const tympanManager = devicesService.managerRegistry[DeviceType.Tympan];
    tympanManager.addDevice(new TympanDevice(savedDevice.deviceId, savedDevice.name, savedDevice.tabsintId));

    const takenId = 'New ID';
    tympanManager.addDevice(new TympanDevice('UID_Additional', 'Device Name Additional', takenId));

    const devices = await firstValueFrom(devicesService.devices);
    const device = devices.find(device => device.deviceId == savedDevice.deviceId);
    expect(device).toBeDefined();

    if (device) {
      await devicesService.setTabsintId(device, takenId);
    }

    const updatedDevices = await firstValueFrom(devicesService.devices);
    const updatedDevice = updatedDevices.find(device => device.deviceId == savedDevice.deviceId);
    expect(updatedDevice?.tabsintId).toEqual(savedDevice.tabsintId);
  });
});
