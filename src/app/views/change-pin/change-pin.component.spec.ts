import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ChangePinComponent } from './change-pin.component';

describe('ChangePinComponent', () => {
  let component: ChangePinComponent;
  let fixture: ComponentFixture<ChangePinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ChangePinComponent,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
