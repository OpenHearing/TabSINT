import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';

import { HintComponent } from './hint.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';

describe('HintComponent', () => {
  let component: HintComponent;
  let fixture: ComponentFixture<HintComponent>;
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
      declarations: [HintComponent],
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

    fixture = TestBed.createComponent(HintComponent);
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

  it('queues a HINT exam on the device when the exam starts', async () => {
    component.device = mockDevice;

    await component.startExam();

    expect(devicesService.abortExams).toHaveBeenCalledWith(mockDevice);
    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'HINT', jasmine.any(Object));
  });

  it('does not queue an exam when no device is available', async () => {
    component.device = undefined;

    await component.startExam();

    expect(devicesService.deviceNotFound).toHaveBeenCalled();
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('toggles, selects all, and clears word selections', () => {
    component.listOfWords = ['the', 'big', 'dog'];
    component.wordsDisabled = false;

    component.toggleWord(0);
    component.toggleWord(2);
    expect(component.response).toEqual([0, 2]);
    expect(component.hintChosen(0)).toBeTrue();
    expect(component.hintChosen(1)).toBeFalse();

    component.toggleWord(0);
    expect(component.response).toEqual([2]);

    component.selectAllWords();
    expect(component.response).toEqual([0, 1, 2]);

    component.clearSelection();
    expect(component.response).toEqual([]);
  });

  it('submits the selected words as a bitmask and requests the next presentation', fakeAsync(() => {
    component.device = mockDevice;
    component.listOfWords = ['the', 'big', 'dog'];
    component.wordsDisabled = false;
    (component as unknown as { examActive: boolean }).examActive = true;
    // Select words 0 and 2 -> bitmask 2^0 + 2^2 = 5; WordCount 3.
    component.response = [0, 2];

    component.processSelectedWords();
    flush();
    flushMicrotasks();

    expect(devicesService.examSubmission).toHaveBeenCalledWith(mockDevice, { name: 'HINT$Submission', CorrectWords: 5, WordCount: 3 });
  }));

  it('restores submit and advances the page when the device reports the exam is complete', async () => {
    component.device = mockDevice;
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', { State: 2 }] });

    await component.startExam();

    expect(stateModel.getState().isSubmittable).toBeTrue();
    expect(examService.submitDefault).toHaveBeenCalled();
  });
});
