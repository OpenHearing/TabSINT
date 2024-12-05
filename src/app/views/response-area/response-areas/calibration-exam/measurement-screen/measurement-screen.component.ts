import { Component, EventEmitter, Input, Output} from '@angular/core';

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
  
  @Input() userInput: number | null = null;
  showValidationError: boolean = false;
  validationMessage: string = '';

  
  validateAndProceed(): boolean {
    if (this.userInput !== null) {
      this.showValidationError = false;
      this.validationMessage = ''; 
      this.measurementUpdated.emit(this.userInput);
      return true;
    } else {
      this.showValidationError = true;
      this.validationMessage = 'Please enter a value to proceed.';
      return false;
    }
  }
  
}
