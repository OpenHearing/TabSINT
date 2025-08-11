import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-fpl-calibration-screen',
  templateUrl: './fpl-calibration-screen.component.html',
  styleUrls: ['./fpl-calibration-screen.component.css']
})
export class FPLCalibrationScreenComponent {
  @Input() outputChannel: string = "";
  @Input() PctComplete: number = 0;
  @Output() runCalibration = new EventEmitter<void>();
  @Output() abortCalibration = new EventEmitter<void>();

  calibrate(): void {
    this.runCalibration.emit();
  }

  abort(): void {
    this.abortCalibration.emit();
  }

}
