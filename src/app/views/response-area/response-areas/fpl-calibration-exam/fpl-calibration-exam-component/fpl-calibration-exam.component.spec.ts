import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FPLCalibrationExamComponent } from './fpl-calibration-exam.component';
import { FormsModule } from '@angular/forms';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';


describe('FPLCalibrationExamComponent', () => {
  let component: FPLCalibrationExamComponent;
  let fixture: ComponentFixture<FPLCalibrationExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FPLCalibrationExamComponent],
      imports: [
        FormsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FPLCalibrationExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
