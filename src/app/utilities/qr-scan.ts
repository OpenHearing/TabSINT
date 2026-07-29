import type { QrService } from '../services/qr.service';
import type { DiskModel } from '../models/disk/disk.service';
import { Notifications } from '../services/notifications.service';
import { DialogType } from './constants';
import { preferencesSchema } from '../../schema/definitions/preferences.schema';

interface ScanQrDeps {
  qrService: QrService;
  diskModel: DiskModel;
  notifications: Notifications;
}

/**
 * Scan the configuration QR code and adjust the preferences.
 */
export async function scanQrCodeAndAutoConfig({ qrService, diskModel, notifications }: ScanQrDeps) {
  const preferences = await qrService.validatedScan(preferencesSchema);
  if (preferences) {
    diskModel.updatePreferences(preferences);
    notifications.alert({
      title: 'QR Code',
      content: 'QR code scanned successfully, configuration has been updated.',
      type: DialogType.Alert,
    });
  } else {
    notifications.alert({
      title: 'QR Code',
      content: 'Failed to configure the application with the provided QR code.',
      type: DialogType.Alert,
    });
  }
}
