import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ExamTestingComponent } from './exam-testing.component';
import { ResponseAreaComponent } from '../response-area/response-area.component';

describe('ExamTestingComponent', () => {
  let component: ExamTestingComponent;
  let fixture: ComponentFixture<ExamTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamTestingComponent, ResponseAreaComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
