import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { ExamTestingComponent } from './exam-testing.component';
import { ResponseAreaComponent } from '../response-area/response-area.component';

describe('ExamTestingComponent', () => {
  let component: ExamTestingComponent;
  let fixture: ComponentFixture<ExamTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamTestingComponent, ResponseAreaComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExamTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
