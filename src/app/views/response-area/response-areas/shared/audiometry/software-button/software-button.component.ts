import { Component, EventEmitter, Input, Output } from '@angular/core';

/** "tap" pulses pressed briefly then releases itself (Hughson-Westlake, GAP, masked threshold). */
/** "hold" stays pressed until the subject releases it (Bekesy). */
export type SoftwareButtonMode = 'tap' | 'hold';

/**
 * On-screen response button shared across audiometry exams, in place of (or alongside) a
 * physical hardware button. This component only owns the press/release interaction and
 * visual state - it emits pressStart/pressEnd and leaves any device communication (e.g.
 * DevicesService.setSoftwareButtonState) or response bookkeeping to the consuming exam.
 */
@Component({
  selector: 'app-software-button',
  templateUrl: './software-button.component.html',
  styleUrl: './software-button.component.css',
})
export class SoftwareButtonComponent {
  @Input() mode: SoftwareButtonMode = 'tap';
  @Input() buttonText = 'Tap this button when you hear a set of sounds';
  @Input() buttonPressedText?: string;
  @Input() disabled = false;

  @Output() readonly pressStart = new EventEmitter<void>();
  @Output() readonly pressEnd = new EventEmitter<void>();

  pressed = false;

  private readonly tapDurationMs = 150;

  get displayText(): string {
    return this.pressed && this.buttonPressedText ? this.buttonPressedText : this.buttonText;
  }

  onPressStart(): void {
    if (this.disabled || this.pressed) {
      return;
    }

    this.pressed = true;
    this.pressStart.emit();

    if (this.mode === 'tap') {
      setTimeout(() => {
        this.pressed = false;
        this.pressEnd.emit();
      }, this.tapDurationMs);
    }
  }

  onPressEnd(): void {
    if (this.disabled || this.mode !== 'hold') {
      return;
    }

    this.pressed = false;
    this.pressEnd.emit();
  }
}
