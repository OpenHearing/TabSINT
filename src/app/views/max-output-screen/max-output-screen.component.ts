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
  maxOutputValue: number | null = null;

  onTogglePlay(): void {
    this.togglePlay.emit();
  }

  next(): void {
    this.nextStep.emit();
  }

}
