import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-measurement-screen',
  templateUrl: './measurement-screen.component.html',
  styleUrls: ['./measurement-screen.component.css']
})
export class MeasurementScreenComponent {
  @Input() isPlaying: boolean = false;
  @Input() currentFrequency: number = 0;
  @Input() targetLevel: number = 0;
  @Output() nextStep = new EventEmitter<void>();
  @Output() togglePlay = new EventEmitter<void>();
  @Output() measurementUpdated = new EventEmitter<number>();
  
  userInput: number | null = null;
  showValidationError: boolean = false;

  next(): void {
    if (this.userInput !== null) {
      this.showValidationError = false;
      this.measurementUpdated.emit(this.userInput);
      this.nextStep.emit();
    }
    this.showValidationError = true
  }
  
}
