import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppState, BluetoothType, DeviceState, DeviceType } from '../../../../utilities/constants';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { Subscription } from 'rxjs/internal/Subscription';
import { DiskModel } from '../../../../models/disk/disk.service';
import { firstValueFrom, Observable } from 'rxjs';
import { DiskInterface } from '../../../../models/disk/disk.interface';
import { DevicesService } from '../../../../services/devices/devices.service';
import { IWahtsDevice } from '../../../../interfaces/devices/wahts-device.interface';

@Component({
  selector: 'app-device-config-view',
  templateUrl: './device-config.component.html',
  styleUrl: './device-config.component.css',
})
export class DeviceConfigComponent implements OnInit, OnDestroy {
  private readonly stateModel = inject(StateModel);
  private readonly translate = inject(TranslateService);
  private readonly diskModel = inject(DiskModel);
  private readonly devicesService = inject(DevicesService);

  state: StateInterface;
  stateSubscription: Subscription | undefined;
  disk: Observable<DiskInterface>;
  BluetoothType = BluetoothType;

  constructor() {
    this.state = this.stateModel.getState();
    this.disk = this.diskModel.diskSubject;
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.stateModel.updateState({ appState: AppState.Admin });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Change the connection type used for WAHTS devices.
   * This will drop any existing WAHTS devices which do not match the specified type.
   *
   * @param connectionType The connection type to use for WAHTS devices.
   */
  async changeWahtsConnectionType(connectionType: BluetoothType): Promise<void> {
    const devices = await firstValueFrom(this.devicesService.devices);
    const removableDevices = devices.filter(device => device.type === DeviceType.Wahts && (device as IWahtsDevice).connectionType !== connectionType);
    for (const device of removableDevices) {
      if (device.state !== DeviceState.Disconnected) {
        await this.devicesService.disconnect(device);
      }
      await this.devicesService.removeSavedDevice(device);
    }
    this.diskModel.updatePreferences({ wahtsConnectionType: connectionType });
  }

  wahtsCommunicationPopover = this.translate.instant('Set the connection type for WAHTS devices.');
}
