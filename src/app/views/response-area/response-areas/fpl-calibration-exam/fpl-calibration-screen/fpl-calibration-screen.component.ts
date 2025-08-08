import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-fpl-calibration-screen',
  templateUrl: './fpl-calibration-screen.component.html',
  styleUrls: ['./fpl-calibration-screen.component.css']
})
export class FPLCalibrationScreenComponent {
  @Input() outputChannel: string = "";
  @Output() runCalibration = new EventEmitter<void>();
  @Output() abortCalibration = new EventEmitter<void>();
  @Output() waitForWAIExam = new EventEmitter<void>();
  @Output() nextStep = new EventEmitter<void>();

  calibrate(): void {
    this.runCalibration.emit();
  }

  abort(): void {
    this.abortCalibration.emit();
  }

  waitForWAIExamCompletion(): void {
    this.waitForWAIExam.emit();
  }

  next(): void {
    this.nextStep.emit();
  }

}
