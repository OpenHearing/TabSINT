import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QrScanService } from './qr-scan.service';
import { QrService } from './qr.service';
import { DiskModel } from '../models/disk/disk.service';
import { Notifications } from './notifications.service';
import { DialogType } from '../utilities/constants';

describe('QrScanService', () => {
  let qrScanService: QrScanService;
  let qrServiceSpy: jasmine.SpyObj<QrService>;
  let diskModelSpy: jasmine.SpyObj<DiskModel>;
  let notificationsSpy: jasmine.SpyObj<Notifications>;

  beforeEach(() => {
    qrServiceSpy = jasmine.createSpyObj('QrService', ['validatedScan']);
    diskModelSpy = jasmine.createSpyObj('DiskModel', ['updatePreferences']);
    notificationsSpy = jasmine.createSpyObj('Notifications', ['alert']);
    notificationsSpy.alert.and.returnValue(of('closed'));

    TestBed.configureTestingModule({
      providers: [
        QrScanService,
        { provide: QrService, useValue: qrServiceSpy },
        { provide: DiskModel, useValue: diskModelSpy },
        { provide: Notifications, useValue: notificationsSpy },
      ],
    });

    qrScanService = TestBed.inject(QrScanService);
  });

  it('should be created', () => {
    expect(qrScanService).toBeTruthy();
  });

  describe('scanAndAutoConfig', () => {
    it('updates preferences and shows a success alert when the scan is valid', async () => {
      const preferences = { debugMode: true };
      qrServiceSpy.validatedScan.and.resolveTo(preferences);

      await qrScanService.scanAndAutoConfig();

      expect(diskModelSpy.updatePreferences).toHaveBeenCalledWith(preferences);
      expect(notificationsSpy.alert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'QR Code',
          type: DialogType.Alert,
          content: jasmine.stringMatching(/successfully/),
        })
      );
    });

    it('shows a failure alert and does not update preferences when the scan is invalid', async () => {
      qrServiceSpy.validatedScan.and.resolveTo(undefined);

      await qrScanService.scanAndAutoConfig();

      expect(diskModelSpy.updatePreferences).not.toHaveBeenCalled();
      expect(notificationsSpy.alert).toHaveBeenCalledWith(
        jasmine.objectContaining({
          title: 'QR Code',
          type: DialogType.Alert,
          content: jasmine.stringMatching(/Failed/),
        })
      );
    });
  });
});
