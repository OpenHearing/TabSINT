import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { InputParametersComponent } from './input-parameters.component';

describe('InputParametersComponent', () => {
  let component: InputParametersComponent;
  let fixture: ComponentFixture<InputParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputParametersComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InputParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
