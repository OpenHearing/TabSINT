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
  userInput: number | null = null;
  @Output() togglePlay = new EventEmitter<void>();
  next(): void {
    this.nextStep.emit();
  }
  onTogglePlay(): void {
    this.togglePlay.emit();
  }
}
