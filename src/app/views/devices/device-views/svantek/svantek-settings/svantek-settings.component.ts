import { Component, Input } from '@angular/core';
import { ISvantekDevice } from '../../../../../interfaces/devices/svantek-device.interface';
import { DeviceState } from '../../../../../utilities/constants';

@Component({
  selector: 'app-svantek-settings',
  templateUrl: './svantek-settings.component.html',
})
export class SvantekSettingsComponent {
  @Input() device!: ISvantekDevice;
  readonly DeviceState = DeviceState;
}
