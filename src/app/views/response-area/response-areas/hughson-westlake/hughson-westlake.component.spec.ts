import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { HughsonWestlakeComponent } from './hughson-westlake.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { HughsonWestlakeResultsInterface } from './hughson-westlake.interface';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';

describe('HughsonWestlakeComponent', () => {
  let component: HughsonWestlakeComponent;
  let fixture: ComponentFixture<HughsonWestlakeComponent>;
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
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', { Threshold: 40, ResultType: 0 }] });
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
      declarations: [HughsonWestlakeComponent],
      imports: [
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

    fixture = TestBed.createComponent(HughsonWestlakeComponent);
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
    expect(component.hwState).toBe('start');
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('queues a HughsonWestlake exam on the device when Begin is pressed', async () => {
    component.device = mockDevice;

    await component.beginExam();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'HughsonWestlake', jasmine.any(Object));
    expect(component.hwState).toBe('exam');
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

  it('auto-begins the exam when autoBegin is configured and a device is available', async () => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'hw',
      responseArea: { type: 'hughsonWestlakeResponseArea', autoBegin: true },
    });
    await fixture.whenStable();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice, 'HughsonWestlake', jasmine.any(Object));
    expect(component.hwState).toBe('exam');
  });

  it('overrides resultMainText and resultSubText from the response area config', async () => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'hw',
      responseArea: {
        type: 'hughsonWestlakeResponseArea',
        resultMainText: 'Custom main text',
        resultSubText: 'Custom sub text',
      },
    });
    await fixture.whenStable();

    expect(component.resultMainText).toBe('Custom main text');
    expect(component.resultSubText).toBe('Custom sub text');
  });

  it('starts masking noise before queuing the exam and stops it on teardown, when maskingNoise is configured', async () => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'hw',
      responseArea: {
        type: 'hughsonWestlakeResponseArea',
        maskingNoise: { Type: 'White', Level: [30, 30] },
      } as ResponseArea,
    });
    await fixture.whenStable();

    await component.beginExam();
    expect(devicesService.startMaskingNoise).toHaveBeenCalledWith(mockDevice, jasmine.objectContaining({ Type: 'White' }));

    component.ngOnDestroy();
    expect(devicesService.stopMaskingNoise).toHaveBeenCalledWith(mockDevice);
  });

  it('stops masking noise as soon as the exam completes, not just on teardown', async () => {
    const pageModel = TestBed.inject(PageModel);

    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'hw',
      responseArea: {
        type: 'hughsonWestlakeResponseArea',
        maskingNoise: { Type: 'White', Level: [30, 30] },
      } as ResponseArea,
    });
    await fixture.whenStable();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (component as any).fetchAndFinishExam();

    expect(devicesService.stopMaskingNoise).toHaveBeenCalledWith(mockDevice);
    expect(component.hwState).not.toBe('exam');
  });

  it('does not start or stop masking noise when maskingNoise is not configured', async () => {
    component.device = mockDevice;

    await component.beginExam();
    component.ngOnDestroy();

    expect(devicesService.startMaskingNoise).not.toHaveBeenCalled();
    expect(devicesService.stopMaskingNoise).not.toHaveBeenCalled();
  });

  it('computes level-progression point styles: filled for heard responses, open for no response, highlight at the confirmed threshold', () => {
    const results: HughsonWestlakeResultsInterface = {
      RetSPL: 0,
      L: [40, 35, 30, 30, 30],
      FalsePositive: [0, 0, 0, 0, 0],
      ResponseTime: [500, 500, 0, 500, 500],
      NumCorrectResp: 2,
      Threshold: 30,
      Units: 0,
      ResultType: 'Threshold',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createLevelProgressionData(results);

    expect(data.pointStyles).toEqual(['filled', 'filled', 'open', 'highlight', 'highlight']);
    expect(data.referenceLine).toBe(30);
    expect(data.connectLine).toBe(true);
    expect(data.y).toEqual(results.L);
    expect(data.xLabel).toBe('Presentation');
    expect(data.yLabel).toBe('dB HL');
    expect(data.title).toBe('Threshold at 30 dB HL (5 trials)');
    expect(data.maxY).toBe(50);
  });

  it('falls back to the result type, with no reference line or highlighted points, when the exam did not confirm a threshold', () => {
    const results: HughsonWestlakeResultsInterface = {
      RetSPL: 0,
      L: [40, 45, 50, 55, 60],
      FalsePositive: [0, 0, 0, 0, 0],
      ResponseTime: [500, 500, 500, 500, 0],
      NumCorrectResp: 0,
      Threshold: NaN,
      Units: 0,
      ResultType: 'Failed to Converge',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createLevelProgressionData(results);

    expect(data.pointStyles).toEqual(['filled', 'filled', 'filled', 'filled', 'open']);
    expect(data.referenceLine).toBeUndefined();
    expect(data.title).toBe('Level Progression: Failed to Converge (5 trials)');
    expect(data.maxY).toBe(70);
  });

  it('titles the plot as a screener outcome, scaled to the tested level, when Screener is configured', () => {
    (component as unknown as { examProperties: { Screener: boolean } }).examProperties.Screener = true;
    const results: HughsonWestlakeResultsInterface = {
      RetSPL: 0,
      L: [25, 25, 25, 25, 25],
      FalsePositive: [0, 0, 0, 0, 0],
      ResponseTime: [500, 500, 500, 0, 500],
      NumCorrectResp: 4,
      Threshold: NaN,
      Units: 0,
      ResultType: 'Pass',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (component as any).createLevelProgressionData(results);

    expect(data.title).toBe('Screener: Pass (5 trials)');
    expect(data.referenceLine).toBeUndefined();
    expect(data.maxY).toBe(35);
  });

  it('remaps ResultType to the screener pass/fail vocabulary when Screener is configured', () => {
    (component as unknown as { examProperties: { Screener: boolean } }).examProperties.Screener = true;

    const passResults = { ResultType: 'Threshold' } as HughsonWestlakeResultsInterface;
    const failResults = { ResultType: 'Failed to Converge' } as HughsonWestlakeResultsInterface;
    const unusedResults = { ResultType: 'Hearing Potentially Outside Measurable Range' } as HughsonWestlakeResultsInterface;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).applyScreenerResultType(passResults);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).applyScreenerResultType(failResults);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).applyScreenerResultType(unusedResults);

    expect(passResults.ResultType).toBe('Pass');
    expect(failResults.ResultType).toBe('Fail');
    expect(unusedResults.ResultType).toBe('Unused');
  });

  it('does not remap ResultType when Screener is not configured', () => {
    const results = { ResultType: 'Threshold' } as HughsonWestlakeResultsInterface;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (component as any).applyScreenerResultType(results);

    expect(results.ResultType).toBe('Threshold');
  });
});
