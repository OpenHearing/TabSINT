import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { SoftwareButtonComponent } from './software-button.component';

describe('SoftwareButtonComponent', () => {
  let component: SoftwareButtonComponent;
  let fixture: ComponentFixture<SoftwareButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoftwareButtonComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SoftwareButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('tap mode: presses briefly then releases itself', fakeAsync(() => {
    component.mode = 'tap';
    const starts: void[] = [];
    const ends: void[] = [];
    component.pressStart.subscribe(() => starts.push(undefined));
    component.pressEnd.subscribe(() => ends.push(undefined));

    component.onPressStart();
    expect(component.pressed).toBe(true);
    expect(starts.length).toBe(1);

    tick(150);
    expect(component.pressed).toBe(false);
    expect(ends.length).toBe(1);
  }));

  it('tap mode: ignores a manual pressEnd, since release is automatic', fakeAsync(() => {
    component.mode = 'tap';
    component.onPressStart();
    component.onPressEnd();
    expect(component.pressed).toBe(true);
    tick(150);
  }));

  it('hold mode: stays pressed until onPressEnd is called', () => {
    component.mode = 'hold';
    const ends: void[] = [];
    component.pressEnd.subscribe(() => ends.push(undefined));

    component.onPressStart();
    expect(component.pressed).toBe(true);
    expect(ends.length).toBe(0);

    component.onPressEnd();
    expect(component.pressed).toBe(false);
    expect(ends.length).toBe(1);
  });

  it('does not emit when disabled', () => {
    component.disabled = true;
    const starts: void[] = [];
    component.pressStart.subscribe(() => starts.push(undefined));

    component.onPressStart();

    expect(component.pressed).toBe(false);
    expect(starts.length).toBe(0);
  });

  it('shows buttonPressedText while pressed if provided', () => {
    component.mode = 'hold';
    component.buttonText = 'Press when you hear it';
    component.buttonPressedText = 'Keep holding...';

    expect(component.displayText).toBe('Press when you hear it');
    component.onPressStart();
    expect(component.displayText).toBe('Keep holding...');
  });
});
