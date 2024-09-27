import { Component } from '@angular/core';
import { TympanState, AvailableConnectableDevices } from '../../../../utilities/constants';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { ConnectedDevice } from '../../../../interfaces/new-device.interface';
import { TympanService } from '../../../../controllers/tympan.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { MatDialog } from '@angular/material/dialog';
import { DeviceChooseComponent } from '../device-choose/device-choose.component';
import { BleDevice } from '../../../../interfaces/bluetooth.interface';
import { DeviceUtil } from '../../../../utilities/device-utility';
@Component({
  selector: 'new-connection',
  templateUrl: './new-connection.component.html'
})

export class NewConnectionComponent {
  TympanState = TympanState;
  state: StateInterface
  devices: DevicesInterface;
  newConnectedDevice: ConnectedDevice;
  deviceTypes = AvailableConnectableDevices;
  // tabsintIds: Array<string> = [];

  constructor(
    private deviceModel: DevicesModel, 
    private tympanService: TympanService, 
    private stateModel: StateModel,
    private dialog: MatDialog,
    private deviceUtil: DeviceUtil
  ) {
    this.devices = this.deviceModel.getDevices();
    this.state = this.stateModel.getState();
    this.newConnectedDevice = {"type":"Select One"};
  }

  changeDeviceType(type:string) {
    this.newConnectedDevice.type = type;
    if (this.newConnectedDevice.type=="Tympan") {
      this.newConnectedDevice.state = TympanState.Disconnected;
    }
    this.newConnectedDevice.tabsintId = this.deviceUtil.getNextFreeDeviceId();
    // this.tabsintIds = [];
    // for (let i = 1; i < 6; i++) {
    //   this.tabsintIds.push(i.toString());
    // }
  }

  // changeTabsintId(tabsintId:string) {
  //   this.newConnectedDevice.tabsintId = tabsintId;
  // }

  addNewConnection(): void {
    this.state.newDeviceConnection = true;
  }

  async scanAndConnect() {
    // TODO: Expand this to connect to other devices besides Tympans
    if (this.newConnectedDevice.type=='Tympan') {
      await this.tympanService.startScan();

      this.dialog.open(DeviceChooseComponent).afterClosed().subscribe(
        async (tympan: BleDevice | undefined) => {
          if (tympan!=undefined) {
            await this.tympanService.connect(tympan, this.newConnectedDevice);
          } else {
            await this.tympanService.stopScan();
          }
          this.state.newDeviceConnection = false;
          this.newConnectedDevice = {"type":"Select One"};
        }
      );
    }
  }

  cancel() {
    this.state.newDeviceConnection = false;
    this.newConnectedDevice = {"type":"Select One"};
  }

}
