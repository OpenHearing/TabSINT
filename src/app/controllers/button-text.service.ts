import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ButtonTextService {
  private readonly buttonTextSubject = new BehaviorSubject<string>('Submit');
  buttonText$ = this.buttonTextSubject.asObservable();

  updateButtonText(newText: string): void {
    this.buttonTextSubject.next(newText);
  }
}