import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { BhaftComponent } from './bhaft.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { BhaftResultsInterface } from './bhaft.interface';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';
import { SoftwareButtonComponent } from '../shared/audiometry/software-button/software-button.component';
import { AudiometryPropertiesComponent } from '../shared/audiometry/audiometry-properties/audiometry-properties.component';
import { InputParametersComponent } from '../shared/input-parameters/input-parameters.component';
import { TrialProgressionPlotComponent } from '../shared/trial-progression-plot/trial-progression-plot.component';

describe('BhaftComponent', () => {
  let component: BhaftComponent;
  let fixture: ComponentFixture<BhaftComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;

  const mockDevice = { deviceId: 'WAHTS-1', type: DeviceType.Wahts, status: DeviceStatus.Ready } as unknown as IDevice;

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'getDeviceOrDefault',
      'confirmSingleDevice',
      'deviceNotFound',
      'abortExams',
      'queueExam',
      'requestResults',
      'requestStatus',
      'setSoftwareButtonState',
      'startMaskingNoise',
      'stopMaskingNoise',
    ]);
    devicesService.getDeviceOrDefault.and.resolveTo([mockDevice]);
    devicesService.confirmSingleDevice.and.resolveTo(mockDevice);
    devicesService.deviceNotFound.and.resolveTo(undefined);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.queueExam.and.resolveTo(undefined);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { ThresholdFrequency: 8000, ThresholdLevel: 65, F: [8000], L: [80], ResultType: 'Threshold' }],
    });
    devicesService.requestStatus.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Status', { state: 1 }] });
    devicesService.setSoftwareButtonState.and.resolveTo(undefined);
    devicesService.startMaskingNoise.and.resolveTo(undefined);
    devicesService.stopMaskingNoise.and.resolveTo(undefined);

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'resetDefault',
      'submitPartialDefault',
      'navigateToTargetDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [BhaftComponent, SoftwareButtonComponent, AudiometryPropertiesComponent, InputParametersComponent, TrialProgressionPlotComponent],
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

    fixture = TestBed.createComponent(BhaftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts on the landing state and does not auto-begin the exam', () => {
    expect(component.bhaftState).toBe('start');
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('queues a BHAFT exam on the device when Begin is pressed', async () => {
    component.device = mockDevice;

    await component.beginExam();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'BHAFT', jasmine.any(Object));
    expect(component.bhaftState).toBe('exam');
  });

  it('does not queue an exam when no device is available', async () => {
    component.device = undefined;

    await component.beginExam();

    expect(devicesService.deviceNotFound).toHaveBeenCalled();
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('defaults resultMainText/resultSubText to the standard completion message', () => {
    expect(component.resultMainText).toBe('Exam complete, press submit.');
    expect(component.resultSubText).toBe('');
  });

  it('auto-begins the exam when autoBegin is configured and a device is available', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: { type: 'bhaftResponseArea', autoBegin: true },
    });
    tick();
    fixture.detectChanges();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'BHAFT', jasmine.any(Object));
    expect(component.bhaftState).toBe('exam');
    component.ngOnDestroy();
  }));

  it('overrides resultMainText and resultSubText from the response area config', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: {
        type: 'bhaftResponseArea',
        resultMainText: 'Custom main text',
        resultSubText: 'Custom sub text',
      },
    });
    tick();
    fixture.detectChanges();

    expect(component.resultMainText).toBe('Custom main text');
    expect(component.resultSubText).toBe('Custom sub text');
    component.ngOnDestroy();
  }));

  it('starts masking noise before queuing the exam and stops it on teardown, when maskingNoise is configured', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: {
        type: 'bhaftResponseArea',
        maskingNoise: { Type: 'White', Level: [30, 30] },
      } as ResponseArea,
    });
    tick();
    fixture.detectChanges();

    component.beginExam();

    tick();
    fixture.detectChanges();

    expect(devicesService.startMaskingNoise).toHaveBeenCalledWith(mockDevice, jasmine.objectContaining({ Type: 'White' }));

    component.ngOnDestroy();
    expect(devicesService.stopMaskingNoise).toHaveBeenCalledWith(mockDevice);
  }));

  it('stops masking noise as soon as the exam completes, not just on teardown', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: {
        type: 'bhaftResponseArea',
        maskingNoise: { Type: 'White', Level: [30, 30] },
      } as ResponseArea,
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();

    tick();
    fixture.detectChanges();

    expect(devicesService.stopMaskingNoise).toHaveBeenCalledWith(mockDevice);
    expect(component.bhaftState).not.toBe('exam');
    component.ngOnDestroy();
  }));

  it('does not start or stop masking noise when maskingNoise is not configured', async () => {
    component.device = mockDevice;

    await component.beginExam();
    component.ngOnDestroy();

    expect(devicesService.startMaskingNoise).not.toHaveBeenCalled();
    expect(devicesService.stopMaskingNoise).not.toHaveBeenCalled();
  });

  it("forwards a press to the device and does not auto-release (hold mode, unlike Hughson-Westlake's tap)", async () => {
    component.device = mockDevice;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).examActive = true;

    await component.onPressStart();

    expect(devicesService.setSoftwareButtonState).toHaveBeenCalledWith(mockDevice, 1);
    expect(devicesService.setSoftwareButtonState).not.toHaveBeenCalledWith(mockDevice, 0);
  });

  it('forwards a release to the device only when the button is released', async () => {
    component.device = mockDevice;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).examActive = true;

    await component.onPressEnd();

    expect(devicesService.setSoftwareButtonState).toHaveBeenCalledWith(mockDevice, 0);
  });

  it('computes frequency-progression point styles: filled for a hit, open for a miss, with a reference line at the confirmed threshold', () => {
    const results: BhaftResultsInterface = {
      ThresholdFrequency: 11000,
      ThresholdLevel: 65,
      F: [8000, 9000, 11000, 10000, 9500, 11000],
      L: [80, 80, 80, 80, 80, 80],
      ResultType: 'Threshold',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createFrequencyProgressionData(results);

    expect(data.pointStyles).toEqual(['filled', 'filled', 'open', 'open', 'filled', 'filled']);
    expect(data.referenceLine).toBe(11000);
    expect(data.referenceLineColor).toBe('#FF0000');
    expect(data.connectLine).toBe(true);
    expect(data.y).toEqual(results.F);
    expect(data.xLabel).toBe('Presentation');
    expect(data.yLabel).toBe('Hz');
    expect(data.title).toBe('Frequency Threshold at 11000 Hz (6 trials)');
  });

  it('falls back to the result type, with no reference line, when frequency did not converge', () => {
    const results: BhaftResultsInterface = {
      ThresholdFrequency: NaN,
      ThresholdLevel: NaN,
      F: [8000, 9000, 10000, 11000, 12000],
      L: [80, 80, 80, 80, 80],
      ResultType: 'Failed to Converge',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createFrequencyProgressionData(results);

    expect(data.referenceLine).toBeUndefined();
    expect(data.title).toBe('Frequency Progression: Failed to Converge (5 trials)');
  });

  it('classifyHitOrMiss: FLFT phase (frequency varying) — filled for a hit (frequency rises), open for a miss (frequency falls)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classify = (frequencies: number[], levels: number[]) => (component as any).classifyHitOrMiss(frequencies, levels);
    const flatLevels = [0, 0, 0, 0, 0, 0]; // irrelevant while frequency is doing the moving

    expect(classify([10, 12, 15, 13, 11, 14], flatLevels)).toEqual(['filled', 'filled', 'open', 'open', 'filled', 'filled']);
    expect(classify([10, 5], [0, 0])).toEqual(['open', 'open']);
    expect(classify([5], [0])).toEqual(['filled']);
    expect(classify([], [])).toEqual([]);
  });

  it('classifyHitOrMiss: falls back to level once frequency hits the ceiling and holds flat (FFLT phase) — filled for a hit (level falls), open for a miss (level rises)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classify = (frequencies: number[], levels: number[]) => (component as any).classifyHitOrMiss(frequencies, levels);

    // Presentations 0-1: FLFT, frequency climbing on hits. Presentation 2 hits the ceiling
    // (10000) and stays there for the rest — from here, level is what's actually moving: it falls
    // on the two hits (indices 2 and 4) and rises on the one miss (index 3).
    const frequencies = [8000, 9000, 10000, 10000, 10000, 10000];
    const levels = [80, 80, 80, 75, 80, 78];

    expect(classify(frequencies, levels)).toEqual(['filled', 'filled', 'filled', 'open', 'filled', 'filled']);
  });

  it('repeats the exam on the first failure to converge when repeatIfFailedOnce is set', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { ThresholdFrequency: NaN, ThresholdLevel: NaN, F: [], L: [], ResultType: 'Failed to Converge' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: { type: 'bhaftResponseArea', autoBegin: true, repeatIfFailedOnce: true },
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    expect(component.bhaftState).toBe('start');
    expect(component.retryMessage).toBeDefined();
    component.ngOnDestroy();
  }));

  it('asks for notes after a second consecutive failure when getNotesIfFailedTwice is set', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { ThresholdFrequency: NaN, ThresholdLevel: NaN, F: [], L: [], ResultType: 'Failed to Converge' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: { type: 'bhaftResponseArea', autoBegin: true, repeatIfFailedOnce: true, getNotesIfFailedTwice: true },
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    expect(component.bhaftState).toBe('notes');
    component.ngOnDestroy();
  }));

  it('shows the no-response message when the software button was never pressed', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: {
        type: 'bhaftResponseArea',
        autoBegin: true,
        showMessageIfNoResponse: true,
        examProperties: { UseSoftwareButton: true },
      } as ResponseArea,
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    expect(component.noResponseMessage).toBeDefined();
    expect(component.bhaftState).toBe('results');
    component.ngOnDestroy();
  }));

  it('shows the device response (frequency/threshold) as visible text once results are available', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { ThresholdFrequency: 9500, ThresholdLevel: 72, F: [8000, 9500], L: [80, 72], ResultType: 'Threshold' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: { type: 'bhaftResponseArea', autoBegin: true },
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    const responseText: string = fixture.nativeElement.querySelector('.bhaft-response')?.textContent ?? '';
    expect(responseText).toContain('9500');
    expect(responseText).toContain('72');
    component.ngOnDestroy();
  }));

  it('shows "Test Unsuccessful" with the ResultType when the result does not converge', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { ThresholdFrequency: NaN, ThresholdLevel: NaN, F: [8000, 9500], L: [80, 72], ResultType: 'Failed to Converge' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bhaft',
      responseArea: { type: 'bhaftResponseArea', autoBegin: true },
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.bhaft-response')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Test Unsuccessful');
    expect(fixture.nativeElement.textContent).toContain('Failed to Converge');
    component.ngOnDestroy();
  }));
});
