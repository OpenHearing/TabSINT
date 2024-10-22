import { ThisReceiver } from '@angular/compiler';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-max-output-screen',
  templateUrl: './max-output-screen.component.html',
  styleUrls: ['./max-output-screen.component.css']
})
export class MaxOutputScreenComponent {
  @Input() isPlaying: boolean = false;
  @Input() currentFrequency: number = 0;
  @Input() targetLevel: number = 0;
  @Input() earCup: string = '';
  @Output() nextStep = new EventEmitter<void>();
  @Output() togglePlay = new EventEmitter<void>();
  @Output() maxOutputUpdated = new EventEmitter<number>();
  
  maxOutputValue: number | null = null;
  showValidationError: boolean = false;


  validationMessage: string = '';
  
  validateAndProceed(): boolean {
    if (this.maxOutputValue !== null) {
      this.showValidationError = false;
      this.validationMessage = ''; 
      this.maxOutputUpdated.emit(this.maxOutputValue);
      // this.nextStep.emit();
      this.maxOutputValue = null
      return true;
    } else {
      this.showValidationError = true;
      this.validationMessage = 'Please enter a value to proceed.';
      return false;
    }
  }
  
  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  // next(): void {
  //   if (this.maxOutputValue !== null) {
  //     this.showValidationError = false
  //     this.maxOutputUpdated.emit(this.maxOutputValue);
  //     this.nextStep.emit();
  //     this.maxOutputValue = null
  //   } else {
  //   this.showValidationError = true
  //   }
  // }

}
