import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-calibration-screen',
  templateUrl: './calibration-screen.component.html',
  styleUrls: ['./calibration-screen.component.css']
})
export class CalibrationScreenComponent {
  @Input() isPlaying: boolean = false;
  @Input() currentFrequency: number = 0;
  @Input() targetLevel: number = 0;
  @Input() calFactor: number = 0;
  @Input() earCup: string = '';
  @Output() calFactorAdjusted = new EventEmitter<number>();
  @Output() nextStep = new EventEmitter<void>();
  @Output() togglePlay = new EventEmitter<void>();
  adjustCalFactor(amount: number): void {
    this.calFactorAdjusted.emit(amount);
  }
  
  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  next(): void {
    this.nextStep.emit();
  }
}
