import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { MpanlComponent } from './mpanl.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { Logger } from '../../../../services/logger.service';
import { DevicesService } from '../../../../services/devices/devices.service';
import { Notifications } from '../../../../services/notifications.service';
import { DeviceStatus, DeviceType } from '../../../../utilities/constants';
import { IDevice } from '../../../../interfaces/devices/device.interface';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { SvantekResultInterface } from '../../../../interfaces/svantek-result.interface';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';

describe('MpanlComponent', () => {
  let component: MpanlComponent;
  let fixture: ComponentFixture<MpanlComponent>;
  let devicesService: jasmine.SpyObj<DevicesService>;
  let examService: jasmine.SpyObj<ExamService>;
  let notifications: jasmine.SpyObj<Notifications>;
  let pageModel: PageModel;
  let resultsModel: ResultsModel;

  const mockDevice = { deviceId: 'SV-1', type: DeviceType.Svantek, status: DeviceStatus.Ready } as unknown as IDevice;

  // 1/3-octave Leq values (28 bands, 20Hz-10kHz) with the octave-band center at 1000Hz set high so
  // calculateSvantekBandLevel (power-sum of the center band + its two 1/3-octave neighbors) is easy to hand-verify.
  const mockSvantekResult: SvantekResultInterface = {
    time: new Date(0).toJSON(),
    status: 0,
    Leq: new Array(28).fill(20),
    Frequencies: [
      20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000,
      10000,
    ],
    LeqA: 30,
    LeqC: 32,
    LeqZ: 33,
    overallAmbientNoise: 30,
  };

  beforeEach(async () => {
    devicesService = jasmine.createSpyObj<DevicesService>('DevicesService', [
      'getDeviceOrDefault',
      'startRecording',
      'stopRecording',
      'getSvantekResult',
    ]);
    devicesService.getDeviceOrDefault.and.resolveTo([mockDevice]);
    devicesService.startRecording.and.resolveTo(undefined);
    devicesService.stopRecording.and.resolveTo(undefined);
    devicesService.getSvantekResult.and.returnValue(mockSvantekResult);

    examService = jasmine.createSpyObj<ExamService>('ExamService', ['submit', 'submitDefault']);

    notifications = jasmine.createSpyObj<Notifications>('Notifications', ['alert']);
    notifications.alert.and.returnValue(of('closed'));

    await TestBed.configureTestingModule({
      declarations: [MpanlComponent],
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
        { provide: Notifications, useValue: notifications },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MpanlComponent);
    component = fixture.componentInstance;
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

  it('defaults to the ANSI standard, its 7 octave bands, and the 3s/10s duration buttons', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea' },
    });
    fixture.detectChanges();

    expect(component.standard).toBe('ANSI S3.1-R2008');
    expect(component.durations).toEqual([3000, 10000]);
    expect(component.examState).toBe('start');
  });

  it('cancels the page when F/MPANL/attenuation are overridden with mismatched array lengths', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea', F: [500, 1000], MPANL: [10, 10, 10] } as ResponseArea,
    });
    fixture.detectChanges();

    expect(notifications.alert).toHaveBeenCalled();
    expect(resultsModel.resultsModel.currentPage.response).toBe('cancelled');
    expect(examService.submit).toHaveBeenCalled();
  });

  it('alerts and stays on the start screen when no Svantek dosimeter is connected', fakeAsync(() => {
    devicesService.getDeviceOrDefault.and.resolveTo([]);
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea' },
    });
    fixture.detectChanges();

    component.startMeasurement(3000);
    tick();

    expect(notifications.alert).toHaveBeenCalled();
    expect(devicesService.startRecording).not.toHaveBeenCalled();
    expect(component.examState).toBe('start');
  }));

  it('measures for the requested duration and computes octave band results relative to the standard limits and WAHTS attenuation', fakeAsync(() => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea' },
    });
    fixture.detectChanges();

    component.startMeasurement(3000);
    tick();

    expect(devicesService.startRecording).toHaveBeenCalledWith(mockDevice);
    expect(component.examState).toBe('recording');

    tick(3000);
    flush();

    expect(devicesService.stopRecording).toHaveBeenCalledWith(mockDevice);
    expect(component.examState).toBe('results');
    expect(component.mpanlResults?.duration).toBe(3000);
    expect(component.mpanlResults?.data.length).toBe(7);
    expect(component.mpanlResults?.data.map(d => d.freq)).toEqual([125, 250, 500, 1000, 2000, 4000, 8000]);
    // Every 1/3-octave band is flat at 20dB, so each octave band level is the power-sum of 3 equal 20dB bands: 20 + 10*log10(3).
    const expectedLevel = Math.round((20 + 10 * Math.log10(3)) * 10) / 10;
    expect(component.mpanlResults?.data[3].level).toBe(expectedLevel);
    expect(component.mpanlResults?.data[3].limit).toBe(13);
    expect(component.mpanlResults?.data[3].attenuation).toBe(39.5);
    expect(resultsModel.resultsModel.currentPage.response).toBe(component.mpanlResults);
  }));

  it('auto-submits after a measurement when autoSubmit is configured', fakeAsync(() => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea', autoSubmit: true },
    });
    fixture.detectChanges();

    component.startMeasurement(3000);
    tick(3000);

    expect(examService.submit).toHaveBeenCalled();
  }));

  it('records the response as skipped and submits when the overridden skip is invoked', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'mpanl',
      responseArea: { type: 'mpanlResponseArea' },
    });
    fixture.detectChanges();

    examService.skip();

    expect(resultsModel.resultsModel.currentPage.response).toBe('skipped');
    expect(examService.submit).toHaveBeenCalled();
  });
});
