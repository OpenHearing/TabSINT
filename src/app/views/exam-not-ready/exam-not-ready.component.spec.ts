import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ExamNotReadyComponent } from './exam-not-ready.component';

describe('ExamNotReadyComponent', () => {
  let component: ExamNotReadyComponent;
  let fixture: ComponentFixture<ExamNotReadyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamNotReadyComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamNotReadyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
