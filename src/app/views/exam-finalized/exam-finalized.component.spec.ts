import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { ExamFinalizedComponent } from './exam-finalized.component';

describe('ExamFinalizedComponent', () => {
  let component: ExamFinalizedComponent;
  let fixture: ComponentFixture<ExamFinalizedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamFinalizedComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamFinalizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
