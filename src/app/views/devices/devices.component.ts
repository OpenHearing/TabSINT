import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { DeviceState, DeviceType } from '../../utilities/constants';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { Observable, map } from 'rxjs';
import { DevicesService } from '../../services/devices/devices.service';
import { IWahtsDevice } from '../../interfaces/devices/wahts-device.interface';
import { ITympanDevice } from '../../interfaces/devices/tympan-device.interface';
import { IDuodoseDevice } from '../../interfaces/devices/duodose-device.interface';
import { ISvantekDevice } from '../../interfaces/devices/svantek-device.interface';
import { IDevice } from '../../interfaces/devices/device.interface';

@Component({
  selector: 'app-devices-view',
  templateUrl: './devices.component.html',
  styleUrl: './devices.component.css',
})
export class DevicesComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly stateModel = inject(StateModel);
  private readonly diskModel = inject(DiskModel);
  private readonly devicesService = inject(DevicesService);

  state: StateInterface;
  disk: DiskInterface;
  stateSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;
  tympanDevices$!: Observable<ITympanDevice[]>;
  wahtsDevices$!: Observable<IWahtsDevice[]>;
  duodoseDevices$!: Observable<IDuodoseDevice[]>;
  svantekDevices$!: Observable<ISvantekDevice[]>;

  constructor() {
    this.state = this.stateModel.getState();
    this.disk = this.diskModel.getDisk();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.diskSubscription = this.diskModel.diskSubject.subscribe(updatedDisk => {
      this.disk = updatedDisk;
    });
    this.tympanDevices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === DeviceType.Tympan && d.state !== DeviceState.Discovery).map(d => d as ITympanDevice))
    );
    this.wahtsDevices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === DeviceType.Wahts && d.state !== DeviceState.Discovery).map(d => d as IWahtsDevice))
    );
    this.duodoseDevices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === DeviceType.Duodose && d.state !== DeviceState.Discovery).map(d => d as IDuodoseDevice))
    );
    this.svantekDevices$ = this.devicesService.devices.pipe(
      map(devices => devices.filter(d => d.type === DeviceType.Svantek && d.state !== DeviceState.Discovery).map(d => d as ISvantekDevice))
    );
    this.examService.switchToAdminView();
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Tracking for devices by the device identifier.
   * @param index The index in the loop.
   * @param device The device to track.
   * @returns The device identifier for tracking.
   */
  trackByDeviceId(index: number, device: IDevice) {
    return device.deviceId;
  }

  DeviceType = DeviceType;
  title = 'config';
}
