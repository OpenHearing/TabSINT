import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { BekesyLikeComponent } from './bekesy-like.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { BekesyLikeResultsInterface } from './bekesy-like.interface';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';
import { SoftwareButtonComponent } from '../shared/audiometry/software-button/software-button.component';
import { AudiometryPropertiesComponent } from '../shared/audiometry/audiometry-properties/audiometry-properties.component';
import { InputParametersComponent } from '../shared/input-parameters/input-parameters.component';
import { TrialProgressionPlotComponent } from '../shared/trial-progression-plot/trial-progression-plot.component';

describe('BekesyLikeComponent', () => {
  let component: BekesyLikeComponent;
  let fixture: ComponentFixture<BekesyLikeComponent>;
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
      msg: ['Result', { RetSPL: 10, L: [40, 44, 40, 36], MaximumExcursion: 8, Slope: -0.06, Threshold: 40, Units: 1, ResultType: 'Threshold' }],
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
      declarations: [
        BekesyLikeComponent,
        SoftwareButtonComponent,
        AudiometryPropertiesComponent,
        InputParametersComponent,
        TrialProgressionPlotComponent,
      ],
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

    fixture = TestBed.createComponent(BekesyLikeComponent);
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
    expect(component.bekesyLikeState).toBe('start');
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('queues a BekesyLike exam on the device when Begin is pressed', async () => {
    component.device = mockDevice;

    await component.beginExam();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'BekesyLike', jasmine.any(Object));
    expect(component.bekesyLikeState).toBe('exam');
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
      id: 'bekesy-like',
      responseArea: { type: 'bekesyLikeResponseArea', autoBegin: true },
    });
    tick();
    fixture.detectChanges();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'BekesyLike', jasmine.any(Object));
    expect(component.bekesyLikeState).toBe('exam');
    component.ngOnDestroy();
  }));

  it('overrides resultMainText and resultSubText from the response area config', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy-like',
      responseArea: {
        type: 'bekesyLikeResponseArea',
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
      id: 'bekesy-like',
      responseArea: {
        type: 'bekesyLikeResponseArea',
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
      id: 'bekesy-like',
      responseArea: {
        type: 'bekesyLikeResponseArea',
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
    expect(component.bekesyLikeState).not.toBe('exam');
    component.ngOnDestroy();
  }));

  it('does not start or stop masking noise when maskingNoise is not configured', async () => {
    component.device = mockDevice;

    await component.beginExam();
    component.ngOnDestroy();

    expect(devicesService.startMaskingNoise).not.toHaveBeenCalled();
    expect(devicesService.stopMaskingNoise).not.toHaveBeenCalled();
  });

  it('forwards a press to the device and does not auto-release (hold mode)', async () => {
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

  it('classifyLevelDirection: a level decrease into the next presentation is a hit (filled), an increase is a miss (open)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classify = (levels: number[]) => (component as any).classifyLevelDirection(levels);

    expect(classify([40, 38, 35, 37, 39, 36])).toEqual(['filled', 'filled', 'open', 'open', 'filled', 'filled']);
    expect(classify([40, 44])).toEqual(['open', 'open']);
    expect(classify([40])).toEqual(['filled']);
    expect(classify([])).toEqual([]);
  });

  it('computes level-progression point styles and a reference line at the confirmed threshold', () => {
    const results: BekesyLikeResultsInterface = {
      RetSPL: 10,
      L: [40, 44, 40, 36, 40, 36],
      MaximumExcursion: 8,
      Slope: -0.06,
      Threshold: 38.456,
      Units: 1,
      ResultType: 'Threshold',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createLevelProgressionData(results);

    expect(data.pointStyles).toEqual(['open', 'filled', 'filled', 'open', 'filled', 'filled']);
    expect(data.pointShape).toBe('circle');
    expect(data.referenceLine).toBe(38.456);
    expect(data.connectLine).toBe(true);
    expect(data.y).toEqual(results.L);
    expect(data.xLabel).toBe('Presentation');
    expect(data.title).toContain('Threshold at 38.46');
  });

  it('falls back to the result type, with no reference line, when the exam did not converge', () => {
    const results: BekesyLikeResultsInterface = {
      RetSPL: 10,
      L: [40, 44, 48, 52],
      MaximumExcursion: 8,
      Slope: 0.1,
      Threshold: NaN,
      Units: 1,
      ResultType: 'Hearing Potentially Better than Calibrated Range',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createLevelProgressionData(results);

    expect(data.referenceLine).toBeUndefined();
    expect(data.title).toBe('Level Progression: Hearing Potentially Better than Calibrated Range (4 trials)');
  });

  it('repeats the exam on the first failure to converge when repeatIfFailedOnce is set', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { RetSPL: NaN, L: [], MaximumExcursion: NaN, Slope: NaN, Threshold: NaN, Units: 1, ResultType: 'Failed to Converge' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy-like',
      responseArea: { type: 'bekesyLikeResponseArea', autoBegin: true, repeatIfFailedOnce: true },
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    expect(component.bekesyLikeState).toBe('start');
    expect(component.retryMessage).toBeDefined();
    component.ngOnDestroy();
  }));

  it('asks for notes after a second consecutive failure when getNotesIfFailedTwice is set', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { RetSPL: NaN, L: [], MaximumExcursion: NaN, Slope: NaN, Threshold: NaN, Units: 1, ResultType: 'Failed to Converge' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy-like',
      responseArea: { type: 'bekesyLikeResponseArea', autoBegin: true, repeatIfFailedOnce: true, getNotesIfFailedTwice: true },
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

    expect(component.bekesyLikeState).toBe('notes');
    component.ngOnDestroy();
  }));

  it('shows the no-response message when the software button was never pressed', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy-like',
      responseArea: {
        type: 'bekesyLikeResponseArea',
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
    expect(component.bekesyLikeState).toBe('results');
    component.ngOnDestroy();
  }));

  it('shows the device response (frequency/threshold) as rounded text, while the stored results keep full precision', fakeAsync(() => {
    const pageModel = TestBed.inject(PageModel);
    devicesService.requestResults.and.resolveTo({
      deviceId: mockDevice.deviceId,
      msg: ['Result', { RetSPL: 10, L: [40, 36], MaximumExcursion: 4, Slope: -0.05, Threshold: 39.567, Units: 1, ResultType: 'Threshold' }],
    });

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy-like',
      responseArea: {
        type: 'bekesyLikeResponseArea',
        autoBegin: true,
        examProperties: { F: 1000, LevelUnits: 'dB HL' },
      } as ResponseArea,
    });
    tick();
    fixture.detectChanges();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).fetchAndFinishExam();
    tick();
    fixture.detectChanges();

    const responseText: string = fixture.nativeElement.querySelector('.bekesy-like-response')?.textContent ?? '';
    expect(responseText).toContain('1000');
    expect(responseText).toContain('39.57');
    expect(component.results?.Threshold).toBe(39.567);
    component.ngOnDestroy();
  }));
});
