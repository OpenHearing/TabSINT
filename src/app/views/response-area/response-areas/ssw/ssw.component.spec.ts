import { ComponentFixture, TestBed, fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';

import { SswComponent } from './ssw.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';
import { SswDeviceState, SswLanguage, SswResponseInterface } from './ssw.interface';

describe('SswComponent', () => {
  let component: SswComponent;
  let fixture: ComponentFixture<SswComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;
  let stateModel: StateModel;
  let pageModel: PageModel;
  let resultsModel: ResultsModel;

  const mockDevice = { deviceId: 'WAHTS-1', type: DeviceType.Wahts, status: DeviceStatus.Ready } as unknown as IDevice;

  const deviceResult = (result: object) => ({ deviceId: mockDevice.deviceId, msg: ['Result', result] });

  const presentation = (state: SswDeviceState, overrides: object = {}) =>
    deviceResult({ State: state, presentationNumber: 1, currentPresentation: 'air plane wet paint', firstEar: 'left', ...overrides });

  const loadSswPage = (responseArea: object) => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'ssw',
      responseArea: { type: 'sswResponseArea', ...responseArea } as ResponseArea,
    });
  };

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'confirmSingleDeviceId',
      'deviceNotFound',
      'abortExams',
      'queueExam',
      'examSubmission',
      'requestResults',
    ]);
    devicesService.confirmSingleDeviceId.and.resolveTo(mockDevice.deviceId);
    devicesService.deviceNotFound.and.resolveTo(undefined);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.queueExam.and.resolveTo(undefined);
    devicesService.examSubmission.and.resolveTo(undefined);
    devicesService.requestResults.and.resolveTo(deviceResult({ State: SswDeviceState.Done }));

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'resetDefault',
      'submitPartialDefault',
      'navigateToTargetDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [SswComponent],
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

    fixture = TestBed.createComponent(SswComponent);
    component = fixture.componentInstance;
    stateModel = TestBed.inject(StateModel);
    pageModel = TestBed.inject(PageModel);
    resultsModel = TestBed.inject(ResultsModel);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('queues an SSW exam with the language sent as its enumeration index', fakeAsync(() => {
    loadSswPage({ examProperties: { language: SswLanguage.Practice, nPresentations: 4 } });
    flushMicrotasks();

    expect(devicesService.abortExams).toHaveBeenCalledWith(mockDevice.deviceId);
    expect(devicesService.queueExam).toHaveBeenCalledWith(
      mockDevice.deviceId,
      'SSW',
      jasmine.objectContaining({ language: 2, nPresentations: 4, presentationLevel: 65, firstEar: 1, groupedPresentations: [0, 0, 0] })
    );
    expect(component.numberOfPresentations).toBe(4);
  }));

  it('does not queue an exam when no device is available', async () => {
    component.deviceId = undefined;

    await component.startExam();

    expect(devicesService.deviceNotFound).toHaveBeenCalled();
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('shows the presentation words pre-marked correct and keeps polling while the device is playing', fakeAsync(() => {
    devicesService.requestResults.and.returnValues(
      Promise.resolve(presentation(SswDeviceState.Playing)),
      Promise.resolve(presentation(SswDeviceState.WaitingForResult))
    );
    loadSswPage({});
    flushMicrotasks();

    expect(component.listOfWords).toEqual(['air', 'plane', 'wet', 'paint']);
    expect(component.response).toEqual([1, 2, 3, 4]);
    expect(component.isRightEarFirst).toBeFalse();
    expect(component.presentationCount).toBe(1);
    expect(stateModel.getState().isSubmittable).toBeFalse();

    flush();

    expect(devicesService.requestResults).toHaveBeenCalledTimes(2);
    expect(component.wordsDisabled).toBeFalse();
    expect(stateModel.getState().isSubmittable).toBeTrue();
  }));

  it('tracks the repeat order per word without duplicate order values', () => {
    component.listOfWords = ['air', 'plane', 'wet', 'paint'];
    component.orderValues = [1, 2, 3, 4];
    component.wordsDisabled = false;
    component.selectAll();

    component.removeOrderAtIndex(1);
    expect(component.response).toEqual([1, 0, 3, 4]);
    expect(component.isCorrect(1)).toBeFalse();

    // Giving word 0 the order value 3 clears it from word 2.
    component.setOrderAtIndex(0, 3);
    expect(component.response).toEqual([3, 0, 0, 4]);
    expect(component.hasOrder(0, 3)).toBeTrue();

    component.clearSelection();
    expect(component.response).toEqual([0, 0, 0, 0]);

    component.selectAll();
    expect(component.response).toEqual([1, 2, 3, 4]);
  });

  it('submits the graded order to the device and records the presentation', fakeAsync(() => {
    devicesService.requestResults.and.returnValues(
      Promise.resolve(presentation(SswDeviceState.WaitingForResult, { presentationId: 'p1' })),
      Promise.resolve(deviceResult({ State: SswDeviceState.Done }))
    );
    loadSswPage({});
    flushMicrotasks();
    component.setOrderAtIndex(2, 0);
    component.notes = 'hesitated';

    examService.submit();
    flush();
    flushMicrotasks();

    expect(devicesService.examSubmission).toHaveBeenCalledWith(mockDevice.deviceId, { name: 'SSW$Submission', CorrectWords: [1, 2, 0, 4] });
    expect(component.presentations.length).toBe(1);
    expect(component.presentations[0]).toEqual(
      jasmine.objectContaining({
        presentationId: 'p1',
        words: ['air', 'plane', 'wet', 'paint'],
        response: [1, 2, 0, 4],
        numberCorrect: 3,
        wordCount: 4,
        correct: false,
        firstEar: 'left',
        notes: 'hesitated',
      })
    );
    expect(component.notes).toBe('');
    expect(component.correctPresentations).toBe(0);
  }));

  it('counts a presentation correct only when every word is repeated in order', fakeAsync(() => {
    devicesService.requestResults.and.returnValues(
      Promise.resolve(presentation(SswDeviceState.WaitingForResult)),
      Promise.resolve(deviceResult({ State: SswDeviceState.Done }))
    );
    loadSswPage({});
    flushMicrotasks();

    examService.submit();
    flush();
    flushMicrotasks();

    expect(component.correctPresentations).toBe(1);
    const response = resultsModel.getResults().currentPage?.response as SswResponseInterface;
    expect(response.correctPresentationCount).toBe(1);
    expect(response.presentationCount).toBe(1);
    expect(response.presentations[0].correct).toBeTrue();
  }));

  it('restores submit and marks the exam complete when the device reports DONE', fakeAsync(() => {
    loadSswPage({});
    flushMicrotasks();

    expect(component.examComplete).toBeTrue();
    expect(stateModel.getState().isSubmittable).toBeTrue();
    expect(examService.submitDefault).not.toHaveBeenCalled();
    examService.submit();
    expect(examService.submitDefault).toHaveBeenCalled();
  }));

  it('advances on completion when autoSubmit is turned on', fakeAsync(() => {
    loadSswPage({ autoSubmit: true });
    flushMicrotasks();

    expect(component.autoSubmit).toBeTrue();
    expect(examService.submitDefault).toHaveBeenCalled();
  }));

  it('aborts the exam on the device when destroyed', fakeAsync(() => {
    loadSswPage({});
    flushMicrotasks();
    devicesService.abortExams.calls.reset();

    fixture.destroy();

    expect(devicesService.abortExams).toHaveBeenCalledWith(mockDevice.deviceId);
  }));
});
