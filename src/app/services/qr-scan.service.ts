import { Injectable, inject } from '@angular/core';
import { QrService } from './qr.service';
import { DiskModel } from '../models/disk/disk.service';
import { Notifications } from './notifications.service';
import { DialogType } from '../utilities/constants';
import { preferencesSchema } from '../../schema/definitions/preferences.schema';

/**
 * Service responsible for scanning a configuration QR code and applying it to the app's preferences.
 */
@Injectable({
  providedIn: 'root',
})
export class QrScanService {
  private readonly qrService = inject(QrService);
  private readonly diskModel = inject(DiskModel);
  private readonly notifications = inject(Notifications);

  /**
   * Scan the configuration QR code and adjust the preferences.
   */
  async scanAndAutoConfig() {
    const preferences = await this.qrService.validatedScan(preferencesSchema);
    if (preferences) {
      this.diskModel.updatePreferences(preferences);
      this.notifications.alert({
        title: 'QR Code',
        content: 'QR code scanned successfully, configuration has been updated.',
        type: DialogType.Alert,
      });
    } else {
      this.notifications.alert({
        title: 'QR Code',
        content: 'Failed to configure the application with the provided QR code.',
        type: DialogType.Alert,
      });
    }
  }
}
