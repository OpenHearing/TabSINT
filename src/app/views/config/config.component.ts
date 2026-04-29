import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
import { ExamService } from '../../controllers/exam.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { DeviceType } from '../../utilities/constants';

@Component({
  selector: 'app-config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css',
})
export class ConfigComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly stateModel = inject(StateModel);

  state: StateInterface;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.examService.switchToAdminView();
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  DeviceType = DeviceType;
  title = 'config';
}
