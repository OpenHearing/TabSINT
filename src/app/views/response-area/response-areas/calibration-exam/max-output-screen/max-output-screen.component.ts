
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

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
  @Input() userInput: number | null = null;
  
  maxOutputValue: number | null = null;
  showValidationError: boolean = false;


  validationMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userInput'] && changes['userInput'].currentValue !== undefined) {
      // Reset validation state when userInput changes
      this.showValidationError = false;
      this.validationMessage = '';
    }
  }
  
  validateAndProceed(): boolean {
    if (this.userInput !== null) {
      this.showValidationError = false;
      this.validationMessage = ''; 
      this.maxOutputUpdated.emit(this.userInput);
      this.userInput = null
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

}
