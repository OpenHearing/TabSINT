import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Logger } from './logger.service';
import { DiskModel } from '../models/disk/disk.service';
import { SqLite } from './sqLite.service';
import { BehaviorSubject, of } from 'rxjs';
import { DiskInterface } from '../models/disk/disk.interface';
import { DevicesService } from './devices/devices.service';
import { Notifications } from './notifications.service';
import { AudioService } from './audio.service';
import { PageWavfileInterface } from '../interfaces/page-definition.interface';
import { CalibrationFilter, DeveloperProtocolsCalibration, PlaybackMethod, WavfileWeighting } from '../utilities/constants';
import { TabsintAudioPlugin } from 'tabsintaudio';

const makeDisk = (overrides: Partial<DiskInterface> = {}): DiskInterface =>
  ({
    numLogRows: 0,
    preferences: { disableLogs: false, maxLogRows: 1000 },
    ...overrides,
  }) as DiskInterface;

describe('AudioService', () => {
  let audioService: AudioService;
  let mockDevicesService: jasmine.SpyObj<DevicesService>;
  let mockNotifications: jasmine.SpyObj<Notifications>;
  let mockDiskModel: jasmine.SpyObj<DiskModel>;
  let mockSqLite: jasmine.SpyObj<SqLite>;
  let disk: DiskInterface;
  let wavFile: PageWavfileInterface;
  let mockTabsintAudio: jasmine.SpyObj<TabsintAudioPlugin>;

  beforeEach(() => {
    disk = makeDisk();
    wavFile = {
      path: 'test',
      cal: {
        refType: PlaybackMethod.Arbitrary,
        calibrationFilter: CalibrationFilter.Full,
        wavRMSC: 0.1197166893251347,
        wavRMSA: 0.09302469275515826,
        RMSA: 0.05244911030269619,
        wavRMSZ: 0.17912773297583512,
        RMSZ: 0.10099565982818604,
        normFactor: 1.7736181265667008,
        scaleFactor: 0.6002726824369483,
      },
      useCommonRepo: false,
      playbackMethod: PlaybackMethod.Arbitrary,
      targetSPL: 65,
      weighting: WavfileWeighting.A,
      startTime: 0,
      endTime: 0,
      _resolvedPath: 'test',
    };
    mockDiskModel = jasmine.createSpyObj('DiskModel', ['getDisk']);
    mockDiskModel.diskSubject = new BehaviorSubject<DiskInterface>(disk);
    mockDiskModel.getDisk.and.returnValue(disk);
    mockDevicesService = jasmine.createSpyObj('DevicesService', ['dummyMethod'], { hostMetadata: of({}) });
    mockNotifications = jasmine.createSpyObj('Notifications', ['alert']);
    mockSqLite = jasmine.createSpyObj('SqLite', ['store', 'deleteOlderLogsIfThereAreTooMany']);
    mockTabsintAudio = jasmine.createSpyObj('TabsintAudio', ['preload', 'unload', 'stop', 'play', 'pause', 'seekTo', 'setSystemVolume']);

    TestBed.configureTestingModule({
      providers: [
        Logger,
        { provide: DiskModel, useValue: mockDiskModel },
        { provide: SqLite, useValue: mockSqLite },
        { provide: Notifications, useValue: mockNotifications },
        { provide: DevicesService, useValue: mockDevicesService },
      ],
    });

    audioService = TestBed.inject(AudioService);
    audioService.tabsintAudioPlugin = mockTabsintAudio;
  });

  it('should be created', () => {
    expect(audioService).toBeTruthy();
  });

  it('start playing loads and plays asset', async () => {
    await audioService.startPlaying('test', 1.0, 1.0);
    expect(mockTabsintAudio.preload).toHaveBeenCalled();
    expect(mockTabsintAudio.play).toHaveBeenCalled();
  });

  it('start playing adds asset to active paths', async () => {
    await audioService.startPlaying('test', 1.0, 1.0);
    expect(audioService.getActiveAssets().size).toBe(1);
    expect(audioService.getActiveAssets()).toContain('test');
  });

  it('stop audio unloads and stops all assets', async () => {
    await audioService.startPlaying('test', 1.0, 1.0);
    expect(audioService.getActiveAssets().size).toBe(1);
    expect(audioService.getActiveAssets()).toContain('test');

    await audioService.stopAudio();
    expect(mockTabsintAudio.unload).toHaveBeenCalled();
    expect(mockTabsintAudio.stop).toHaveBeenCalled();
  });

  it('stop audio removes all assets', async () => {
    await audioService.startPlaying('test', 1.0, 1.0);
    expect(audioService.getActiveAssets().size).toBe(1);
    expect(audioService.getActiveAssets()).toContain('test');

    await audioService.stopAudio();
    expect(audioService.getActiveAssets().size).toBe(0);
  });

  it('play wav starts playing after delay', fakeAsync(() => {
    audioService.playWav(wavFile, 5000);

    tick(4999);
    expect(mockTabsintAudio.play).not.toHaveBeenCalled();
    tick(1);
    expect(mockTabsintAudio.play).toHaveBeenCalled();
  }));

  it('play wav seeks to start time', fakeAsync(() => {
    wavFile.startTime = 1000;
    audioService.playWav(wavFile, 0);

    tick(0);
    expect(mockTabsintAudio.seekTo).toHaveBeenCalledWith({ assetId: 'test', time: wavFile.startTime });
  }));

  it('play wav ends at end time', fakeAsync(() => {
    wavFile.endTime = 5000;
    audioService.playWav(wavFile, 0);

    tick(4999);
    expect(mockTabsintAudio.pause).not.toHaveBeenCalled();
    tick(1);
    expect(mockTabsintAudio.pause).toHaveBeenCalled();
  }));

  it('calculate volume returns zero value without calibration', () => {
    wavFile.cal = undefined;
    const volume = audioService.calculateVolume(wavFile);
    expect(volume).toEqual(0);
  });

  it('calculate volume returns a positive value for arbitrary playback method', () => {
    const volume = audioService.calculateVolume(wavFile);
    expect(volume).toBeGreaterThan(0.0);
  });

  it('get tablet gain returns zero for nexus 7', () => {
    const gain = audioService.getTabletGain(DeveloperProtocolsCalibration['develop']);
    expect(gain).toEqual(0.0);
  });

  it(`set system volume calls plugin set system volume`, async () => {
    await audioService.setSystemVolume(1.0);
    expect(mockTabsintAudio.setSystemVolume).toHaveBeenCalledWith({ volume: 1.0 });
  });
});
