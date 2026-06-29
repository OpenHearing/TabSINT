import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';

import { ThreeDigitComponent } from './three-digit.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';

describe('ThreeDigitComponent', () => {
  let component: ThreeDigitComponent;
  let fixture: ComponentFixture<ThreeDigitComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;
  let stateModel: StateModel;

  const mockDevice = { deviceId: 'WAHTS-1', type: DeviceType.Wahts, status: DeviceStatus.Ready } as unknown as IDevice;

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'getDeviceOrDefault',
      'confirmSingleDevice',
      'deviceNotFound',
      'abortExams',
      'queueExam',
      'examSubmission',
      'requestResults',
    ]);
    devicesService.getDeviceOrDefault.and.resolveTo([mockDevice]);
    devicesService.confirmSingleDevice.and.resolveTo(mockDevice);
    devicesService.deviceNotFound.and.resolveTo(undefined);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.queueExam.and.resolveTo(undefined);
    devicesService.examSubmission.and.resolveTo(undefined);
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', null] });

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'resetDefault',
      'submitPartialDefault',
      'navigateToTargetDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [ThreeDigitComponent],
      imports: [
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        ResultsModel,
        StateModel,
        PageModel,
        Logger,
        { provide: ExamService, useValue: examService },
        { provide: DevicesService, useValue: devicesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThreeDigitComponent);
    component = fixture.componentInstance;
    stateModel = TestBed.inject(StateModel);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('queues a ThreeDigit exam on the device when the exam starts', async () => {
    component.device = mockDevice;

    await component.startExam();

    expect(devicesService.abortExams).toHaveBeenCalledWith(mockDevice);
    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'ThreeDigit', jasmine.any(Object));
  });

  it('does not queue an exam when no device is available', async () => {
    component.device = undefined;

    await component.startExam();

    expect(devicesService.deviceNotFound).toHaveBeenCalled();
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('accumulates up to three digits and ignores presses when the keypad is disabled', () => {
    component.autoSubmitPresentation = false;
    component.digitsDisabled = false;

    component.addDigit(1);
    component.addDigit(2);
    component.addDigit(3);
    component.addDigit(4);

    expect(component.userResponse).toEqual(['1', '2', '3']);

    component.digitsDisabled = true;
    component.resetKeypad();
    component.addDigit(5);

    expect(component.userResponse).toEqual([]);
  });

  it('grades entered digits against the presentation answer when the device is ready', fakeAsync(() => {
    component.device = mockDevice;
    component.autoSubmitPresentation = false;
    (component as unknown as { examActive: boolean }).examActive = true;
    (component as unknown as { readyToProcess: boolean }).readyToProcess = true;
    (component as unknown as { currentDigits: string[] }).currentDigits = ['1', '2', '3'];
    component.userResponse = ['1', '2', '4'];
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', { State: 1 }] });

    component.processDigits();
    flushMicrotasks();

    expect(component.digitCorrect).toEqual([true, true, false]);
    expect(component.showFeedback).toBeTrue();

    // Drain the feedback -> submit -> next-presentation timers and assert the score was sent.
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', null] });
    flush();
    flushMicrotasks();

    expect(devicesService.examSubmission).toHaveBeenCalledWith(mockDevice, { name: 'ThreeDigit$Submission', nCorrect: 2 });
  }));

  it('marks the page submittable and auto-submits when the device reports the exam is complete', async () => {
    component.device = mockDevice;
    component.autoSubmit = true;
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { State: 2, digitScore: 80, presentationScore: 10 }],
    });

    await component.startExam();

    expect(component.examComplete).toBeTrue();
    expect(stateModel.getState().isSubmittable).toBeTrue();
    expect(examService.submitDefault).toHaveBeenCalled();
  });
});
