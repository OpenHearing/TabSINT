import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SweptDpoaeExamComponent } from './swept-dpoae-exam.component';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { StateModel } from '../../../../../models/state/state.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { Logger } from '../../../../../services/logger.service';
import { pageInterfaceDefaults } from '../../../../../utilities/defaults';
import { ResponseArea } from '../../../../../interfaces/page-definition.interface';

describe('SweptDpoaeExamComponent', () => {
  let component: SweptDpoaeExamComponent;
  let fixture: ComponentFixture<SweptDpoaeExamComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;
  let pageModel: PageModel;

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', ['abortExams', 'isDeviceMessagePending']);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.isDeviceMessagePending.and.resolveTo(false);

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'reset',
      'resetDefault',
      'submitPartial',
      'submitPartialDefault',
      'navigateToTarget',
      'navigateToTargetDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [SweptDpoaeExamComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        ResultsModel,
        StateModel,
        PageModel,
        Logger,
        ButtonTextService,
        { provide: ExamService, useValue: examService },
        { provide: DevicesService, useValue: devicesService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SweptDpoaeExamComponent);
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

  it('applies autoSubmit from the response area and advances when the exam finishes', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'swept',
      responseArea: { type: 'sweptDPOAEResponseArea', autoSubmit: true } as ResponseArea,
    });
    fixture.detectChanges();

    expect(component.autoSubmit).toBeTrue();

    component.currentStep = 'in-progress';
    await component.nextStep();

    // The component overrides examService.submit, so the observable effect of autoSubmit is that the
    // results step immediately submits the page through submitDefault.
    expect(component.currentStep).toBe('results');
    expect(examService.submitDefault).toHaveBeenCalled();
  });

  it('does not advance when the protocol omits autoSubmit', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'swept',
      responseArea: { type: 'sweptDPOAEResponseArea' } as ResponseArea,
    });
    fixture.detectChanges();

    expect(component.autoSubmit).toBeFalse();

    component.currentStep = 'in-progress';
    await component.nextStep();

    expect(component.currentStep).toBe('results');
    expect(examService.submitDefault).not.toHaveBeenCalled();
  });
});
