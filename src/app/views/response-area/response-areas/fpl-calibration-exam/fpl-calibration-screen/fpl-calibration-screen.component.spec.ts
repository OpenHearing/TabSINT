import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FPLCalibrationScreenComponent } from './fpl-calibration-screen.component';
import { FormsModule } from '@angular/forms';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';


describe('FPLCalibrationExamComponent', () => {
  let component: FPLCalibrationScreenComponent;
  let fixture: ComponentFixture<FPLCalibrationScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FPLCalibrationScreenComponent],
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
    
    fixture = TestBed.createComponent(FPLCalibrationScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
