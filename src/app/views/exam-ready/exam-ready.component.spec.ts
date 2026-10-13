import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamReadyComponent } from './exam-ready.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('ExamReadyComponent', () => {
  let component: ExamReadyComponent;
  let fixture: ComponentFixture<ExamReadyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamReadyComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamReadyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
