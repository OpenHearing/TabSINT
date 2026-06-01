import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { DeviceType } from '../../utilities/constants';
import { DiskModel } from '../../models/disk/disk.service';
import { DiskInterface } from '../../models/disk/disk.interface';

@Component({
  selector: 'app-config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
})
export class ConfigComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly stateModel = inject(StateModel);
  private readonly diskModel = inject(DiskModel);

  state: StateInterface;
  disk: DiskInterface;
  stateSubscription: Subscription | undefined;
  diskSubscription: Subscription | undefined;

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
    this.examService.switchToAdminView();
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  DeviceType = DeviceType;
  title = 'config';
}
