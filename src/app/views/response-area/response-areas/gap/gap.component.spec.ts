import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { FormsModule } from '@angular/forms';

import { GapComponent } from './gap.component';
import { TrialProgressionPlotComponent } from '../shared/trial-progression-plot/trial-progression-plot.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';

describe('GapComponent', () => {
  let component: GapComponent;
  let fixture: ComponentFixture<GapComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;

  const mockDevice = { deviceId: 'WAHTS-1', type: DeviceType.Wahts, status: DeviceStatus.Ready } as unknown as IDevice;

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'confirmSingleDeviceId',
      'deviceNotFound',
      'abortExams',
      'queueExam',
      'requestResults',
      'requestStatus',
      'setSoftwareButtonState',
    ]);
    devicesService.confirmSingleDeviceId.and.resolveTo(mockDevice.deviceId);
    devicesService.deviceNotFound.and.resolveTo(undefined);
    devicesService.abortExams.and.resolveTo(undefined);
    devicesService.queueExam.and.resolveTo(undefined);
    devicesService.requestResults.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Result', null] });
    devicesService.requestStatus.and.resolveTo({ deviceId: mockDevice.deviceId, msg: ['Status', { state: 2 }] });
    devicesService.setSoftwareButtonState.and.resolveTo(undefined);

    examService = jasmine.createSpyObj<ExamService>('ExamService', [
      'submit',
      'submitDefault',
      'resetDefault',
      'submitPartialDefault',
      'navigateToTargetDefault',
    ]);

    await TestBed.configureTestingModule({
      declarations: [GapComponent, TrialProgressionPlotComponent],
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

    fixture = TestBed.createComponent(GapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('queues a GAP exam on the device when the full exam starts', async () => {
    component.deviceId = mockDevice.deviceId;

    await component.startFullExam();

    expect(devicesService.queueExam).toHaveBeenCalledWith(mockDevice.deviceId, 'GAP', jasmine.any(Object));
    expect(component.gapState).toBe('exam');
  });

  it('does not queue an exam when no device is available', async () => {
    component.deviceId = undefined;

    await component.startFullExam();

    expect(devicesService.deviceNotFound).toHaveBeenCalled();
    expect(devicesService.queueExam).not.toHaveBeenCalled();
  });

  it('runs a single-gap-length trial, sending the CHA an integer UseSoftwareButton flag', async () => {
    component.deviceId = mockDevice.deviceId;

    await component.startTrainingTrial(40, 70);

    const [device, examName, properties] = devicesService.queueExam.calls.mostRecent().args;
    expect(device).toBe(mockDevice.deviceId);
    expect(examName).toBe('GAP');
    // The CHA GAP exam expects UseSoftwareButton as an integer (1/0), not a boolean.
    expect(properties).toEqual(jasmine.objectContaining({ AllowableGapLengths: [40], LNoise: 70, UseSoftwareButton: 1 }));
  });

  it('toggles the device software button when the response button is tapped', async () => {
    component.deviceId = mockDevice.deviceId;
    (component as unknown as { examActive: boolean }).examActive = true;

    await component.tapSoftwareButton();

    expect(devicesService.setSoftwareButtonState).toHaveBeenCalledWith(mockDevice.deviceId, 1);
    expect(component.buttonPressed).toBeTrue();
  });
});
