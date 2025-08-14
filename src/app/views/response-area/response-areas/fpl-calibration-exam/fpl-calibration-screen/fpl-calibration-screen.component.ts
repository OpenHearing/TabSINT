import { Component, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-fpl-calibration-screen',
  templateUrl: './fpl-calibration-screen.component.html',
  styleUrls: ['./fpl-calibration-screen.component.css']
})
export class FPLCalibrationScreenComponent {
  calibrationRunning: boolean = false;
  @Input() outputChannel: string = "";
  @Input() PctComplete: number = 0;
  @Input() shouldAbort: boolean = false;
  @Output() runCalibration = new EventEmitter<void>();
  @Output() abortCalibration = new EventEmitter<void>();

  calibrate(): void {
    this.runCalibration.emit();
    this.calibrationRunning = true;
  }

  abort(): void {
    this.abortCalibration.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['outputChannel']) {
      this.calibrationRunning = false;
    }
    if (changes['shouldAbort'] && this.shouldAbort === false) {
      this.calibrationRunning = false;
    }
    if (changes['PctComplete'] && this.PctComplete === 100) {
      this.calibrationRunning = false;
    }
  }

}
