import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationExamComponent } from './calibration-exam.component';
import { CalibrationScreenComponent } from '../calibration-screen/calibration-screen.component';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { PageModel } from '../../../../../models/page/page.service';
import { pageInterfaceDefaults } from '../../../../../utilities/defaults';
import { ResponseArea } from '../../../../../interfaces/page-definition.interface';

describe('CalibrationExamComponent', () => {
  let component: CalibrationExamComponent;
  let fixture: ComponentFixture<CalibrationExamComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;
  let pageModel: PageModel;

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'getDeviceOrDefault',
      'confirmSingleDevice',
      'deviceNotFound',
      'abortExams',
      'examSubmission',
      'queueExam',
      'isDeviceMessagePending',
      'deviceMessagePendingError',
    ]);
    devicesService.getDeviceOrDefault.and.resolveTo([]);
    devicesService.confirmSingleDevice.and.resolveTo(undefined);
    devicesService.deviceNotFound.and.resolveTo(undefined);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.examSubmission.and.resolveTo(undefined);
    devicesService.queueExam.and.resolveTo(undefined);
    devicesService.isDeviceMessagePending.and.returnValue(false);

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'reset',
      'resetDefault',
      'submitPartial',
      'submitPartialDefault',
      'navigateToTarget',
      'navigateToTargetDefault',
      'back',
      'backDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [CalibrationExamComponent, CalibrationScreenComponent],
      imports: [
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        { provide: DevicesService, useValue: devicesService },
        { provide: ExamService, useValue: examService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalibrationExamComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows results when the protocol omits showResults', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'calibration',
      responseArea: { type: 'calibrationResponseArea' } as ResponseArea,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showResults).toBeTrue();
  });

  it('hides results when the protocol turns showResults off', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'calibration',
      responseArea: { type: 'calibrationResponseArea', showResults: false } as ResponseArea,
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showResults).toBeFalse();
  });
});
