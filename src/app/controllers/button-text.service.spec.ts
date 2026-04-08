import { TestBed } from '@angular/core/testing';
import { ButtonTextService } from './button-text.service';

describe('ButtonTextService', () => {
  let service: ButtonTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ButtonTextService] });
    service = TestBed.inject(ButtonTextService);
  });

  it('emits "Submit" as the initial value', done => {
    service.buttonText$.subscribe(text => {
      expect(text).toBe('Submit');
      done();
    });
  });

  it('emits the new text when updated', done => {
    service.updateButtonText('Next');
    service.buttonText$.subscribe(text => {
      expect(text).toBe('Next');
      done();
    });
  });

  it('emits each value in sequence', () => {
    const emitted: string[] = [];
    service.buttonText$.subscribe(text => emitted.push(text));
    service.updateButtonText('Step 1');
    service.updateButtonText('Step 2');
    expect(emitted).toEqual(['Submit', 'Step 1', 'Step 2']);
  });
});
