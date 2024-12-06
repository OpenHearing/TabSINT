import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DevicesService } from '../../../../../controllers/devices.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';

@Component({
  selector: 'swept-oae-in-progress',
  templateUrl: './swept-oae-in-progress.component.html',
  styleUrl: './swept-oae-in-progress.component.css'
})
export class SweptOaeInProgressComponent implements OnInit, OnDestroy {
  @Input() device: ConnectedDevice | undefined;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  pctComplete: number = 0.0;
  examState: string = 'PLAYING';
  state: StateInterface;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.state.isSubmittable = false;
  }

  async ngOnInit(): Promise<void> {
    this.requestResults();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  requestResults() {
    this.intervalId = setInterval(() => {
      // let resp = await this.devicesService.requestResults(this.device!);
      let resp: [number, { State: string; PctComplete: number }] = [-46, {"State": "DONE", "PctComplete":100.0}];
      this.pctComplete = resp[1].PctComplete;
      this.examState = resp[1].State;
      if (this.examState === 'DONE') {
        this.state.isSubmittable = true;
      }
    }, 1000)
  }
  
}
