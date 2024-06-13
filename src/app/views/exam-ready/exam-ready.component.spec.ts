import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamReadyComponent } from './exam-ready.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('ExamReadyComponent', () => {
  let component: ExamReadyComponent;
  let fixture: ComponentFixture<ExamReadyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamReadyComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamReadyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
