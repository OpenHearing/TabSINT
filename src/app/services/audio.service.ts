import { inject, Injectable } from '@angular/core';
import { TabsintAudio } from 'tabsintaudio';
import { Logger } from './logger.service';
import { PageWavfileCalInterface, PageWavfileInterface } from '../interfaces/page-definition.interface';
import { DialogType, Headset, PlaybackMethod, Tablet, WavfileWeighting } from '../utilities/constants';
import { Notifications } from './notifications.service';
import { DevicesService } from './devices/devices.service';
import { IDeviceMetadata } from '../interfaces/devices/device-metadata.interface';
import { DiskModel } from '../models/disk/disk.service';

/**
 * Service responsible for handling audio playback.
 */
@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly disk = inject(DiskModel);
  private readonly devicesService = inject(DevicesService);
  private hostMetadata: IDeviceMetadata | undefined;
  private userHeadset: Headset | undefined;
  private systemVolumeControlEnabled: boolean = false;
  private userTabletGain: number | undefined;
  tabsintAudioPlugin = TabsintAudio;

  /** The active asset paths for audio which are currently loaded and playing.*/
  private activeAssetPaths = new Set<string>();

  // Note: these gain values are relative to that of the Nexus7.
  private readonly tabletGainsNexus7 = {
    Browser: -1,
    'Nexus 7': 0,
    SamsungTabE: -8.5868,
    EPHD1: 0,
    WAHTS: 0,
    SamsungTabA: -4.0596,
    SamsungTabA7Lite: -4.05,
  };

  // Note: these gain values are relative to that of the TabE.
  private readonly tabletGainsTabE = {
    Browser: -1,
    'Nexus 7': 8.5868,
    SamsungTabE: 0,
    EPHD1: 0,
    WAHTS: 0,
    SamsungTabA: 4.5272,
    SamsungTabA7Lite: 4.5368,
  };

  constructor() {
    this.devicesService.hostMetadata.subscribe(data => (this.hostMetadata = data));
    this.disk.diskSubject.subscribe(disk => {
      this.userTabletGain = disk.preferences.tabletGain;
      this.systemVolumeControlEnabled = !disk.preferences.disableVolume;
    });
  }
  /**
   * Get the currently active assets which are loaded.
   * @returns The active loaded assets.
   */
  getActiveAssets() {
    return structuredClone(this.activeAssetPaths);
  }

  /**
   * Stop all audio on the device.
   */
  async stopAudio(): Promise<void> {
    await this.stopPlaying();
  }

  /**
   * Play the phrase audio from the assets directory.
   */
  async playPhrase(): Promise<void> {
    await this.stopPlaying();
    const assetPath = 'public/assets/wavs/word01_norm.wav';
    await this.startPlaying(assetPath, 1.0, 1.0);
  }

  /**
   * Play the comp audio from the assets directory.
   */
  async playCompAudio(): Promise<void> {
    await this.stopPlaying();
    const assetPath = 'public/assets/wavs/CompAudioTest.wav';
    await this.startPlaying(assetPath, 1.0, 1.0);
  }

  /**
   * Play the comp linear audio from the assets directory.
   */
  async playCompAudioLinear(): Promise<void> {
    await this.stopPlaying();
    const assetPath = 'public/assets/wavs/CompAudioTestLinear.wav';
    await this.startPlaying(assetPath, 1.0, 1.0);
  }

  /**
   * Play the 1KHz 94dB audio from the assets directory.
   */
  async play1kHz94dB(): Promise<void> {
    const wavfile: PageWavfileInterface = {
      path: 'public/assets/wavs/1kHz_cal_tone.wav',
      playbackMethod: PlaybackMethod.Arbitrary,
      targetSPL: 94,
    };
    let calibration: PageWavfileCalInterface | undefined = undefined;

    // A separate calibration is needed for each distinct tablet/headset
    // combination. Each calibration must have:
    //      {'wavRMSZ': 0.70231, 'realWorldRMSZ': 0.70231, 'scaleFactor': X.XXXXX};
    // The RMSs always have these values - a function of the wav file.
    // The scaleFactor is hardware dependent and can be found in the
    // tablet_headset-audio_profile.json file.
    switch (this.userHeadset) {
      case Headset.VicFirth:
        calibration = {
          wavRMSZ: 0.70231,
          realWorldRMSZ: 0.70231,
          scaleFactor: 0.60027,
          _headset: Headset.VicFirth,
          _tablet: Tablet.Nexus7,
        };
        break;
      case Headset.VicFirthS2:
        calibration = {
          wavRMSZ: 0.70231,
          realWorldRMSZ: 0.70231,
          scaleFactor: 0.2330724734026138,
          _headset: Headset.VicFirthS2,
          _tablet: Tablet.Nexus7,
        };
        break;
      case Headset.HDA200:
        calibration = {
          wavRMSZ: 0.70231,
          realWorldRMSZ: 0.70231,
          scaleFactor: 0.2774,
          _headset: Headset.HDA200,
          _tablet: Tablet.Nexus7,
        };
        break;
      case Headset.WAHTS:
        calibration = {
          wavRMSZ: 0.70231,
          realWorldRMSZ: 0.70231,
          scaleFactor: 0.13519823071552697,
          _headset: Headset.WAHTS,
          _tablet: Tablet.Nexus7,
        };
        break;
      case Headset.EPHD1:
        calibration = {
          wavRMSZ: 0.70231,
          realWorldRMSZ: 0.70231,
          scaleFactor: 0.09404459105486002,
          _headset: Headset.EPHD1,
          _tablet: Tablet.Nexus7,
        };
        break;
      case Headset.Audiometer:
        calibration = {
          wavRMSZ: 1,
          realWorldRMSZ: 1,
          scaleFactor: 1,
          _headset: Headset.Audiometer,
          _tablet: Tablet.Nexus7,
        };
        break;
      default:
        break;
    }

    if (calibration) {
      await this.stopPlaying();
      wavfile.cal = calibration;
      this.playWav(wavfile, 0);
    } else {
      this.notifications.alert({
        title: 'Alert',
        content: 'No calibrated sound available for this headset.',
        type: DialogType.Alert,
      });
    }
  }

  /**
   * Play wav files to the device.
   * The expected file path is an asset or file with content:// format.
   * @param wavfile The wav file to play.
   * @param startDelay The start delay before starting any audio.
   */
  async playWav(wavfile: PageWavfileInterface, startDelay: number | undefined = 1000) {
    const resolvedPath = wavfile._resolvedPath;
    if (!resolvedPath) {
      const message = `No valid path found for playing audio ${wavfile.path}.`;
      this.logger.warning(message);
      throw new Error(message);
    }

    let volume;
    if (!wavfile.cal) {
      this.logger.warning('No calibration for wavfile ' + wavfile.path + ' ... playing at 25%.');
      volume = 0.25;
    } else if (Array.isArray(wavfile.targetSPL)) {
      volume = [];
      const targetStereoSPL = wavfile.targetSPL;
      for (const target of targetStereoSPL) {
        wavfile.targetSPL = target;
        volume.push(this.calculateVolume(wavfile));
      }
      wavfile._tabletGain = this.getTabletGain(wavfile.cal);
    } else {
      volume = this.calculateVolume(wavfile);
      wavfile._tabletGain = this.getTabletGain(wavfile.cal);
    }

    // Preload the wav file so it can be tracked for cancellation before playing
    const volumeLeft = Array.isArray(volume) ? volume[0] : volume;
    const volumeRight = Array.isArray(volume) ? volume[1] : volume;
    await this.preload(resolvedPath, volumeLeft, volumeRight);

    // Set a timeout which starts the active wav file after a delay
    setTimeout(async () => {
      if (this.activeAssetPaths.has(resolvedPath)) {
        await this.tabsintAudioPlugin.play({ assetId: resolvedPath });
        this.logger.debug(`Starting audio playback: ${wavfile.path}`);
        if (wavfile.startTime && wavfile.startTime > 0) {
          await this.tabsintAudioPlugin.seekTo({ assetId: resolvedPath, time: wavfile.startTime });
        }
        if (wavfile.endTime && wavfile.endTime > 0) {
          setTimeout(
            async () => {
              if (this.activeAssetPaths.has(resolvedPath)) {
                await this.tabsintAudioPlugin.pause({ assetId: resolvedPath });
              }
            },
            wavfile.endTime - (wavfile.startTime ?? 0)
          );
        }
        this.logger.debug(`Playing ${wavfile.path} at Volume [${volumeLeft}, ${volumeRight}]`);
      } else {
        this.logger.debug(`Wav file ${wavfile.path} was cancelled before start delay reached`);
      }
    }, startDelay);
  }

  /**
   * Set the volume level for all active audio.
   * @param vol The volume for all audio.
   */
  async setAllVolume(volume: number | number[]) {
    for (const activeAsset of this.activeAssetPaths) {
      await this.tabsintAudioPlugin.setVolume({ assetId: activeAsset, volume: volume });
    }
  }

  /**
   * Set the volume level for the system/device from (0 to 1).
   * @param vol The volume for the system/device.
   */
  async setSystemVolume(volume: number) {
    if (this.systemVolumeControlEnabled) {
      try {
        await this.tabsintAudioPlugin.setSystemVolume({ volume: volume });
      } catch (error) {
        this.notifications.alert({
          title: 'Alert',
          content: `Failed to set system volume for the device, please manually adjust system volume to ${volume * 100}%.`,
          type: DialogType.Alert,
        });
        this.logger.debug(`Failed to set system volume to ${volume * 100}%`, error);
      }
    }
  }

  /**
   * Get the volume level for the system/device from (0 to 1).
   * @returns The volume of the system/device.
   */
  async getSystemVolume(): Promise<number> {
    return (await this.tabsintAudioPlugin.getSystemVolume()).volume;
  }

  /**
   * Stops all active assets if playing.
   */
  private async stopPlaying(): Promise<void> {
    for (const asset of this.activeAssetPaths) {
      await this.tabsintAudioPlugin.stop({ assetId: asset });
      await this.tabsintAudioPlugin.unload({ assetId: asset });
      this.logger.debug(`Stopping audio asset: ${asset}`);
    }
    this.activeAssetPaths = new Set();
  }

  /**
   * Preload new audio and add it to the active assets.
   * This function should be used before playing all audio as it catches errors during preload and handles active audio tracking.
   * The expected file path is an asset or file with content:// format.
   * @param path The path to the audio file.
   * @param volumeLeft The left channel volume to play at.
   * @param volumeRight The right channel volume to play at.
   */
  private async preload(path: string, volumeLeft: number, volumeRight: number): Promise<void> {
    try {
      await this.tabsintAudioPlugin.preload({
        assetId: path,
        assetPath: path,
        audioChannelNum: 1,
        isUrl: false,
        volume: [volumeLeft, volumeRight],
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Audio Asset already exists') {
        // NOOP
      } else {
        throw error;
      }
    }
    this.activeAssetPaths.add(path);
    this.logger.debug(`Preloaded audio: ${path}`);
  }

  /**
   * Start playing new audio with preloading included.
   * The expected file path is an asset or file with content:// format.
   * @param path The path to the audio file.
   * @param volumeLeft The left channel volume to play at.
   * @param volumeRight The right channel volume to play at.
   */
  async startPlaying(path: string, volumeLeft: number, volumeRight: number): Promise<void> {
    await this.preload(path, volumeLeft, volumeRight);
    await this.tabsintAudioPlugin.play({ assetId: path });
    this.logger.debug(`Starting audio playback: ${path}`);
  }

  /**
   * Calculate volume based on the calibration of a file.
   * @param wavfile The file containing calibration to determine volume for.
   * @returns The volume based on calibration or zero on error.
   */
  calculateVolume(wavfile: PageWavfileInterface): number {
    let volume = 0;

    if (!wavfile.cal) {
      this.logger.error(`Invalid arguments to calculateVolume: ${JSON.stringify(wavfile)}`);
      this.notifications.alert({
        title: 'Alert',
        content: 'Playback Error: Invalid arguments on playback.',
        type: DialogType.Alert,
      });
      return volume;
    }

    const gain = this.getTabletGain(wavfile.cal);
    wavfile.targetSPL = typeof wavfile.targetSPL === 'string' ? parseFloat(wavfile.targetSPL) : wavfile.targetSPL;
    let level = wavfile.targetSPL ? wavfile.targetSPL : 65.0;
    level = level + gain;
    const method = wavfile.playbackMethod ?? PlaybackMethod.Arbitrary;
    const weighting = wavfile.weighting ?? WavfileWeighting.Z;

    if (method === PlaybackMethod.Arbitrary && wavfile.cal.scaleFactor !== undefined) {
      const specifiedPaRMS = 20e-6 * Math.pow(10, level / 20.0);
      const waveformRMS = specifiedPaRMS * wavfile.cal.scaleFactor;
      volume = waveformRMS / (wavfile.cal[('wavRMS' + weighting) as keyof typeof wavfile.cal] as number);
    } else if (
      method === PlaybackMethod.AsRecorded &&
      wavfile.cal.refType !== undefined &&
      wavfile.cal.realWorldRMSZ !== undefined &&
      wavfile.cal.scaleFactor !== undefined &&
      wavfile.cal.wavRMSZ !== undefined
    ) {
      if (wavfile.cal.refType !== PlaybackMethod.AsRecorded) {
        this.logger.error('Invalid "as-recorded" playback request.');
        this.notifications.alert({
          title: 'Alert',
          content: 'Playback Error: Invalid "as-recorded" playback request.',
          type: DialogType.Alert,
        });
      }
      const waveformRMS = wavfile.cal.realWorldRMSZ * wavfile.cal.scaleFactor;
      const volume_prior_tabletGain = waveformRMS / wavfile.cal.wavRMSZ;
      // If playing calibrated media, check what zero point was used (Nexus 7 or TabE) and
      // use appropriate gain.
      volume = Math.pow(10, (20 * Math.log10(volume_prior_tabletGain) + gain) / 20);
    } else {
      this.logger.error(`Invalid arguments to calculateVolume: ${JSON.stringify(wavfile)}`);
      this.notifications.alert({
        title: 'Alert',
        content: 'Playback Error: Invalid arguments on playback.',
        type: DialogType.Alert,
      });
    }

    if (volume > 1.0001) {
      const msg = `CAUTION: Wavfile requested at a volume > 1.0. Playing at 1.0, which does NOT meet spec. Requested volume: ${volume}`;
      this.logger.error(msg);
      this.notifications.alert({
        title: 'Alert',
        content: msg,
        type: DialogType.Alert,
      });
      volume = 1.0;
    } else if (volume > 1.0) {
      // Catches a common floating-point rounding error case where volume is *slightly* greater than 1.0.
      // There's nothing wrong with this, it is expected.
      volume = 1.0;
    }

    if (0 <= volume && volume <= 1) {
      return volume;
    } else {
      const msg = `Volume out of range: ${volume}`;
      this.logger.error(msg);
      this.notifications.alert({
        title: 'Alert',
        content: msg,
        type: DialogType.Alert,
      });
    }
    return volume;
  }

  /**
   * Determine the gain based on tablet type and headset.
   * @param calibration The calibration which defines tablet type.
   * @returns The gain value for the tablet type.
   */
  getTabletGain(calibration: PageWavfileCalInterface): number {
    // User tablet gain overrides default gain values
    if (this.userTabletGain !== undefined) {
      return this.userTabletGain;
    }

    let tabletGain = 0;
    let gainMap = undefined;
    const hostData = this.hostMetadata;

    // Determine the map based on tablet type
    if (calibration._tablet && calibration._tablet == Tablet.TabE) {
      gainMap = this.tabletGainsTabE;
    } else {
      gainMap = this.tabletGainsNexus7;
    }

    // Get the gain value based on headset type in the found tablet map.
    if (calibration._headset === Headset.EPHD1) {
      tabletGain = gainMap.EPHD1;
    } else if (calibration._headset === Headset.WAHTS) {
      tabletGain = gainMap.WAHTS;
    } else if (!hostData) {
      tabletGain = gainMap['Nexus 7'];
    } else if (Object.keys(gainMap).indexOf(hostData.model ?? '') > -1) {
      tabletGain = gainMap[hostData.model as keyof typeof gainMap];
    } else if (hostData.model === 'SAMSUNG-SM-T377A') {
      tabletGain = gainMap.SamsungTabE;
    } else if (hostData.model === 'SM-T380') {
      tabletGain = gainMap.SamsungTabA;
    } else if (hostData.model === 'SM-T220') {
      tabletGain = gainMap.SamsungTabA7Lite;
    } else {
      tabletGain = gainMap['Nexus 7'];
    }

    return tabletGain;
  }
}
