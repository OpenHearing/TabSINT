import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';

@Component({
  selector: 'app-calibration-screen',
  templateUrl: './calibration-screen.component.html',
  styleUrls: ['./calibration-screen.component.css']
})
export class CalibrationScreenComponent implements OnChanges {
  @Input() isPlaying: boolean = false;
  @Input() currentFrequency: number = 0;
  @Input() targetLevel: number = 0;
  @Input() calFactor: number = 0;
  @Input() earCup: string = '';
  @Input() device: ConnectedDevice | undefined;
  @Input() userInput: number | null = null;
  @Output() calFactorAdjusted = new EventEmitter<number>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() togglePlay = new EventEmitter<void>();
  @Output() measurementUpdated = new EventEmitter<number>();
  showValidationError: boolean = false;
  validationMessage: string = '';

  adjustCalFactor(amount: number): void {
    this.calFactorAdjusted.emit(amount);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userInput'] && changes['userInput'].currentValue !== null) {
      // Reset validation state when userInput changes
      this.showValidationError = false;
      this.validationMessage = '';
    }
  }

  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  next(): void {
    this.nextStep.emit();
  }

  validateAndProceed(): boolean {
    if (this.userInput !== null) {
      this.showValidationError = false;
      this.validationMessage = '';
      this.measurementUpdated.emit(this.userInput);
      this.userInput = null;
      return true;
    } else {
      this.showValidationError = true;
      this.validationMessage = 'Please enter a value to proceed.';
      return false;
    }
  }

  onEnterPressed() {
    this.nextStep.emit();
  }
}
