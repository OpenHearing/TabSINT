import { Component } from '@angular/core';
import { TympanState, AvailableConnectableDevices } from '../../../../utilities/constants';
import { DevicesInterface } from '../../../../models/devices/devices.interface';
import { DevicesModel } from '../../../../models/devices/devices.service';
import { newConnectedDevice } from '../../../../interfaces/new-device.interface';
import { TympanService } from '../../../../controllers/tympan.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { MatDialog } from '@angular/material/dialog';
import { DeviceChooseComponent } from '../device-choose/device-choose.component';
import { BleDevice } from '../../../../interfaces/bluetooth.interface';

@Component({
  selector: 'new-connection',
  templateUrl: './new-connection.component.html',
  styleUrl: './new-connection.component.css'
})
export class NewConnectionComponent {
  TympanState = TympanState;
  state: StateInterface
  devices: DevicesInterface;
  newConnectedDevice: newConnectedDevice; //TODO: expand typing to include CHA and Svantek
  deviceTypes = AvailableConnectableDevices;

  constructor(
    public deviceModel: DevicesModel, 
    public tympanService: TympanService, 
    public stateModel: StateModel,
    public dialog: MatDialog
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
  }

  async connectTympan() {
    console.log("connectTympan() button pressed.");
    await this.tympanService.startScan();

    this.dialog.open(DeviceChooseComponent).afterClosed().subscribe(
      async (tympan: BleDevice | undefined) => {
        if (tympan!=undefined) {
          await this.tympanService.connect(tympan);
        } else {
          await this.tympanService.stopScan();
        }
      }
    );
  }

  disconnectTympan() {
    console.log("disconnectTympan() button pressed.");
  }

  cancelConnectTympan() {
    console.log("cancelConnectTympan() button pressed.");
  }

}
