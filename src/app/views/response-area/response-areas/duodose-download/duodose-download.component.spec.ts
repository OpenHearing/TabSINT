import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { DuodoseDownloadComponent } from './duodose-download.component';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { PageModel } from '../../../../models/page/page.service';
import { StateModel } from '../../../../models/state/state.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { IDeviceResponse } from '../../../../interfaces/devices/device-response.interface';

describe('DuodoseDownloadComponent', () => {
  let component: DuodoseDownloadComponent;
  let fixture: ComponentFixture<DuodoseDownloadComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;

  const mockDevice = { deviceId: 'DOS-A0000001', type: DeviceType.Duodose } as unknown as IDevice;

  const directoryResponse = (paths: string[]): IDeviceResponse => ({
    deviceId: mockDevice.deviceId,
    msg: ['Success', paths.map(Path => ({ Path, SizeBytes: 0, Attributes: 272 }))],
  });

  const longNameResponse = (longName: string): IDeviceResponse => ({
    deviceId: mockDevice.deviceId,
    msg: [longName],
  });

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'getDeviceOrDefault',
      'requestSdBytesFree',
      'getDirectory',
      'getChaLongName',
      'copyChaFileToLocalStorageAndReadFile',
    ]);
    devicesService.getDeviceOrDefault.and.resolveTo([mockDevice]);
    devicesService.requestSdBytesFree.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Success', { BytesFree: '1000000' }] });

    await TestBed.configureTestingModule({
      declarations: [DuodoseDownloadComponent],
      imports: [
        CommonModule,
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [ResultsModel, StateModel, PageModel, Logger, { provide: DevicesService, useValue: devicesService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DuodoseDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists session folders using the directory and long-name device calls, skipping non-session entries', async () => {
    devicesService.getDirectory.and.resolveTo(directoryResponse(['CONFIG', 'SHORT~1']));
    devicesService.getChaLongName.and.callFake(async (_device: IDevice, path: string) =>
      path.endsWith('CONFIG') ? longNameResponse('CONFIG') : longNameResponse('A0000001_20260908T144213.000Z_ceareTest')
    );

    await component.getDosimeterFiles();

    expect(devicesService.getDirectory).toHaveBeenCalledWith(mockDevice, component.baseDir);
    expect(devicesService.getChaLongName).toHaveBeenCalledTimes(2);
    expect(component.availableFiles.length).toBe(1);
    expect(component.availableFiles[0].deviceName).toBe('A0000001');
    expect(component.availableFiles[0].sessionName).toBe('ceareTest');
    expect(component.isDosBusy).toBeFalse();
  });

  it('falls back to the listed path when the long name is empty (newer firmware)', async () => {
    devicesService.getDirectory.and.resolveTo(directoryResponse(['A0000001_20260908T144213.000Z_ceareTest']));
    devicesService.getChaLongName.and.resolveTo(longNameResponse(''));

    await component.getDosimeterFiles();

    expect(component.availableFiles.length).toBe(1);
    expect(component.availableFiles[0].longName).toBe('A0000001_20260908T144213.000Z_ceareTest');
  });

  it('stops issuing long-name requests once the component is destroyed mid-listing', async () => {
    devicesService.getDirectory.and.resolveTo(directoryResponse(['A0000001_20260908T144213.000Z_first', 'A0000001_20260908T144513.000Z_second']));
    devicesService.getChaLongName.and.callFake(async (_device: IDevice, path: string) => {
      // Simulate the user navigating away from the page while the first lookup is in flight.
      if (path.endsWith('first')) {
        component.ngOnDestroy();
      }
      return longNameResponse(path);
    });

    await component.getDosimeterFiles();

    expect(devicesService.getChaLongName).toHaveBeenCalledTimes(1);
    expect(component.availableFiles.length).toBe(0);
  });

  it('does not start listing when getDosimeterFiles is called after the component was destroyed', async () => {
    component.ngOnDestroy();

    await component.getDosimeterFiles();

    expect(devicesService.getDeviceOrDefault).not.toHaveBeenCalled();
  });
});
