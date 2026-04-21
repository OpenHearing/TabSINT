import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription, timer } from 'rxjs';
import { PageModel } from '../../../../models/page/page.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { BekesyResponseAreaInterface } from './bekesy.interface';
import { bekesyResponseAreaSchema } from '../../../../../schema/response-areas/bekesy.schema';
import { PageInterface } from '../../../../models/page/page.interface';
import { CommonResponseAreaInterface, PageWavfileInterface } from '../../../../interfaces/page-definition.interface';
import { AudioChannel, PlaybackMethod, WavfileWeighting } from '../../../../utilities/constants';
import { AudioService } from '../../../../services/audio.service';
import { Logger } from '../../../../services/logger.service';

type BekesyRequirements = Required<Omit<BekesyResponseAreaInterface, keyof CommonResponseAreaInterface>>;

@Component({
  selector: 'app-bekesy-response-area',
  templateUrl: './bekesy.component.html',
  styleUrl: './bekesy.component.css',
})
export class BekesyComponent implements OnInit, OnDestroy {
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly examService = inject(ExamService);
  private readonly audioService = inject(AudioService);
  private readonly logger = inject(Logger);

  private pageSubscription: Subscription | undefined;
  private activeInterval: Subscription | undefined = undefined;
  private bekesyTimeoutTimer: Subscription | undefined = undefined;

  private readonly bekesyResponse: string[] = [];
  private readonly bekesyRefreshInterval = 25;
  buttonPressed: boolean = false;
  buttonText: string = bekesyResponseAreaSchema.properties.buttonText.default;

  bekesyResponseParameter: BekesyRequirements = {
    autoSubmit: bekesyResponseAreaSchema.properties.autoSubmit.default,
    buttonText: bekesyResponseAreaSchema.properties.buttonText.default,
    buttonPressedText: bekesyResponseAreaSchema.properties.buttonPressedText.default,
    buttonReleasedText: bekesyResponseAreaSchema.properties.buttonReleasedText.default,
    buttonAlign: bekesyResponseAreaSchema.properties.buttonAlign.default,
    enableSubmit: bekesyResponseAreaSchema.properties.enableSubmit.default,
    buttonBehavior: bekesyResponseAreaSchema.properties.buttonBehavior.default,
    saturatedRollOver: bekesyResponseAreaSchema.properties.saturatedRollOver.default,
    lookUpCorrection: bekesyResponseAreaSchema.properties.lookUpCorrection.default,
    channel: bekesyResponseAreaSchema.properties.channel.default,
    startSPL: bekesyResponseAreaSchema.properties.startSPL.default,
    minTargetLevel: bekesyResponseAreaSchema.properties.minTargetLevel.default,
    maxTargetLevel: bekesyResponseAreaSchema.properties.maxTargetLevel.default,
    timeout: bekesyResponseAreaSchema.properties.timeout.default,
    levelRate: bekesyResponseAreaSchema.properties.levelRate.default,
    numberReversals: bekesyResponseAreaSchema.properties.numberReversals.default,
  };

  private bekesySPL = bekesyResponseAreaSchema.properties.channel.default;
  private bekesyRequestedSPL = bekesyResponseAreaSchema.properties.channel.default;
  private bekesyFixedSPL: number | undefined = undefined;
  private bekesyFixedSaturatedSPL: number | undefined = undefined;
  private bekesyFixedUnsaturatedVolume: number | undefined = undefined;
  private bekesyWavfile: PageWavfileInterface | undefined = undefined;
  private bekesyStepSize = 0;
  private bekesyDirection = 1;
  private saturatedFlag = false;
  private lookUpCorrection = 0;
  private minCorrection = 0;
  private maxCorrection = 0;
  private correction = new Map<number, number>().set(0, 0);
  private reversals = -1; // first two does not count

  ngOnInit(): void {
    this.examService.submit = this.submitButton;
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === 'bekesyResponseArea') {
        const updatedResponseArea = updatedPage.responseArea as BekesyResponseAreaInterface;
        if (updatedResponseArea) {
          this.bekesyResponseParameter = { ...this.bekesyResponseParameter, ...updatedResponseArea };
          this.bekesyWavfile = updatedPage.wavfiles && updatedPage.wavfiles.length > 0 ? updatedPage.wavfiles[0] : undefined;
          this.stateModel.updateState({ isSubmittable: this.bekesyResponseParameter.enableSubmit });
          // Initialize exam properties after defining the bekesy wav file
          this.initializeResponseArea(this.bekesyResponseParameter);
          this.initializeTimers(this.bekesyResponseParameter);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.bekesyTimeoutTimer?.unsubscribe();
    this.activeInterval?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
  }

  /**
   * Submission logic for user events.
   */
  submitButton() {
    this.pushResponse(-2);
    this.finishExam();
  }

  /**
   * Submit the results for the exam and cleanup.
   */
  finishExam() {
    this.resultsModel.updateCurrentPage({ response: this.bekesyResponse });
    this.examService.submitDefault();
  }

  /**
   * Initialize exam specific properties based on exam information.
   * @param bekesyResponseArea The parameters for the response area.
   */
  private initializeResponseArea(bekesyResponseArea: BekesyRequirements) {
    if (!this.bekesyWavfile) {
      this.logger.error('Failed to find a wav file for the exam.');
      return;
    }

    this.bekesyDirection = bekesyResponseArea.buttonBehavior === 'higherOnClick' ? -1 : 1;
    const initializationErrorMsg = 'Failed to initialize response area invalid start SPL.';

    switch (bekesyResponseArea.channel) {
      case AudioChannel.Left:
        if (Array.isArray(bekesyResponseArea.startSPL) && bekesyResponseArea.startSPL.length === 2) {
          this.bekesySPL = bekesyResponseArea.startSPL[0];
          this.bekesyFixedSPL = bekesyResponseArea.startSPL[1];
          this.bekesyWavfile.targetSPL = bekesyResponseArea.startSPL[1];
          this.bekesyFixedUnsaturatedVolume = this.audioService.calculateVolume(this.bekesyWavfile);
        } else {
          this.logger.error(initializationErrorMsg);
          throw new Error(initializationErrorMsg);
        }
        break;
      case AudioChannel.Right:
        if (Array.isArray(bekesyResponseArea.startSPL) && bekesyResponseArea.startSPL.length === 2) {
          this.bekesySPL = bekesyResponseArea.startSPL[1];
          this.bekesyFixedSPL = bekesyResponseArea.startSPL[0];
          this.bekesyWavfile.targetSPL = bekesyResponseArea.startSPL[0];
          this.bekesyFixedUnsaturatedVolume = this.audioService.calculateVolume(this.bekesyWavfile);
        } else {
          this.logger.error(initializationErrorMsg);
          throw new Error(initializationErrorMsg);
        }
        break;
      case AudioChannel.Mono:
        if (typeof bekesyResponseArea.startSPL === 'number') {
          this.bekesySPL = bekesyResponseArea.startSPL ?? Number(this.bekesyWavfile.targetSPL);
        } else {
          this.logger.error(initializationErrorMsg);
          throw new Error(initializationErrorMsg);
        }
        break;
      default:
        bekesyResponseArea.channel satisfies never;
        break;
    }

    this.bekesyRequestedSPL = this.bekesySPL;
    const maxTargetLevel = this.calculateSPL(this.bekesyWavfile);
    this.bekesyResponseParameter.maxTargetLevel = Math.min(maxTargetLevel ?? bekesyResponseArea.maxTargetLevel, bekesyResponseArea.maxTargetLevel);

    const ILD_values: number[] = [];
    this.correction = new Map();
    Array.from(Object.values(bekesyResponseArea.lookUpCorrection)).forEach((value, index) => {
      if (value.length >= 2) {
        ILD_values.push(value[0]);
        this.correction.set(index, value[0] - value[1]);
      }
    });
    this.minCorrection = Math.min.apply(null, ILD_values);
    this.maxCorrection = Math.max.apply(null, ILD_values);
  }

  /**
   * Setup subscriptions for timers and intervals.
   * @param bekesyResponseArea The parameters for the response area.
   */
  initializeTimers(bekestResponseArea: BekesyRequirements) {
    // Reset subscriptions
    this.bekesyTimeoutTimer?.unsubscribe();
    this.activeInterval?.unsubscribe();

    // Activate new subscriptions
    this.bekesyTimeoutTimer = timer(1000 * bekestResponseArea.timeout).subscribe(() => {
      this.pushResponse(-1);
      this.finishExam();
    });
    this.activeInterval = interval(this.bekesyRefreshInterval).subscribe(() => {
      this.updateLevelInterval();
    });
  }

  /**
   * Add a response to the response list.
   * @param button The button which triggered the response.
   */
  pushResponse(button: number) {
    if (this.saturatedFlag) {
      this.bekesyResponse.push(
        JSON.stringify({
          splLevel: this.bekesySPL,
          splLevelRequested: this.bekesyRequestedSPL,
          splLevelFixed: this.bekesyFixedSaturatedSPL,
          time: this.getTimeStr(),
          button: button,
          lookUpCorrection: this.lookUpCorrection,
        })
      );
    } else {
      this.bekesyResponse.push(
        JSON.stringify({
          splLevel: this.bekesySPL,
          splLevelFixed: this.bekesyFixedSPL,
          time: this.getTimeStr(),
          button: button,
          lookUpCorrection: this.lookUpCorrection,
        })
      );
    }
  }

  /**
   * Determine the SPL value based upon the provided channel.
   * @param channel The channel used to determine SPL value.
   * @param spl The SPL values for the different channels.
   * @returns The SPL or undefined if the proper channel could not be used.
   */
  private getSPL(channel: AudioChannel, spl: number | number[]): number | undefined {
    if (Array.isArray(spl) && spl.length == 2) {
      if (channel === AudioChannel.Left) {
        return spl[0];
      } else if (channel === AudioChannel.Right) {
        return spl[1];
      }
    } else if (typeof spl === 'number' && channel === AudioChannel.Mono) {
      return spl;
    }
    return undefined;
  }

  /**
   * Calculate SPL value for a wav file.
   * @param wavfile The wav file to calculate SPL for.
   * @returns The SPL value or undefined if not possible to calculate.
   */
  private calculateSPL(wavfile: PageWavfileInterface): number | undefined {
    if (!wavfile.cal) {
      return undefined;
    }

    const method = wavfile.playbackMethod ?? PlaybackMethod.Arbitrary;
    const weighting = wavfile.weighting ?? WavfileWeighting.Z;
    let level: number | undefined = undefined;

    if (method === PlaybackMethod.Arbitrary) {
      const waveformRMS = wavfile.cal[('wavRMS' + weighting) as keyof typeof wavfile.cal];
      if (!waveformRMS || !wavfile.cal.scaleFactor) {
        return undefined;
      }
      const specifiedPaRMS = Number(waveformRMS) / wavfile.cal.scaleFactor;
      level = 20 * Math.log10(specifiedPaRMS / 20e-6);
      const targetSPL = level - this.audioService.getTabletGain(wavfile.cal);
      return targetSPL;
    }

    return level;
  }

  /**
   * Get correction value from the correction table.
   * @param delta The correction delta.
   * @returns The correction value aligning with the provided delta.
   */
  private correctionTable(delta: number): number | undefined {
    delta = Math.round(delta);

    if (delta < this.minCorrection) {
      delta = this.minCorrection;
    }
    if (delta > this.maxCorrection) {
      delta = this.maxCorrection;
    }

    return this.correction.get(delta);
  }

  /**
   * Update exam properties when a user starts interaction on a button.
   */
  touchstartFun() {
    if (this.bekesyStepSize == 0) {
      this.bekesyStepSize = this.bekesyResponseParameter.levelRate * (this.bekesyRefreshInterval / 1000);
    }

    this.buttonPressed = true;
    this.buttonText = this.bekesyResponseParameter.buttonPressedText;

    this.bekesyDirection *= -1;
    this.reversals++;

    this.pushResponse(1);
  }

  /**
   * Update exam properties when a user moves on a button.
   */
  touchmoveFun() {
    this.buttonPressed = true;
    this.buttonText = this.bekesyResponseParameter.buttonPressedText;
  }

  /**
   * Update exam properties when a user ends interaction on a button.
   */
  touchendFun() {
    this.buttonPressed = false;
    this.buttonText = this.bekesyResponseParameter.buttonReleasedText;

    this.bekesyDirection *= -1;
    this.reversals++;

    if (this.reversals >= this.bekesyResponseParameter.numberReversals) {
      this.finishExam();
    }

    this.pushResponse(0);
  }

  /**
   * Create a time string formatted for a exam response.
   * @returns The time string.
   */
  getTimeStr(): string {
    const time = new Date();
    const hh = time.getHours();
    const mm = time.getMinutes();
    const ss = time.getSeconds();
    const ff = time.getMilliseconds();
    return hh + ':' + mm + ':' + ss + ':' + ff;
  }

  /**
   * Update the level at which active audio output is being played.
   */
  updateLevelInterval() {
    if (!this.bekesyWavfile?.targetSPL) {
      return;
    }

    const currentSPL = this.bekesySPL;
    let fixedVolLevel = this.bekesyFixedUnsaturatedVolume ?? 0;

    if (this.saturatedFlag) {
      this.bekesySPL = this.bekesyRequestedSPL + this.bekesyStepSize * this.bekesyDirection;
      this.bekesyRequestedSPL = this.bekesySPL;
    } else {
      this.bekesySPL = this.bekesySPL + this.bekesyStepSize * this.bekesyDirection;
      this.bekesyRequestedSPL = this.bekesySPL;
    }

    this.saturatedFlag = this.bekesyRequestedSPL >= this.bekesyResponseParameter.maxTargetLevel;
    if (this.bekesyFixedSPL) {
      this.lookUpCorrection = this.correctionTable(this.bekesyRequestedSPL - this.bekesyFixedSPL) ?? this.lookUpCorrection;
    }
    this.bekesySPL = Math.min(this.bekesyResponseParameter.maxTargetLevel, Math.max(this.bekesySPL, this.bekesyResponseParameter.minTargetLevel));

    if (this.bekesyResponseParameter.channel != AudioChannel.Mono) {
      const startSPL = this.getSPL(this.bekesyResponseParameter.channel, this.bekesyResponseParameter.startSPL);
      if (startSPL) {
        this.bekesyWavfile.targetSPL = startSPL - this.lookUpCorrection;
        fixedVolLevel = this.audioService.calculateVolume(this.bekesyWavfile);
        if (this.saturatedFlag && this.bekesyResponseParameter.saturatedRollOver) {
          const delta_max = this.bekesyRequestedSPL - this.bekesyResponseParameter.maxTargetLevel;
          this.lookUpCorrection = this.correctionTable(delta_max) ?? this.lookUpCorrection;
          this.bekesyWavfile.targetSPL = startSPL - delta_max - this.lookUpCorrection;
          this.bekesyFixedSaturatedSPL = startSPL - delta_max;
          fixedVolLevel = this.audioService.calculateVolume(this.bekesyWavfile);
        }
      }
    }

    this.bekesyWavfile.targetSPL = this.bekesySPL;
    let vol = this.audioService.calculateVolume(this.bekesyWavfile);
    if (vol > 1) {
      this.bekesySPL = currentSPL;
      vol = 1;
    }
    switch (this.bekesyResponseParameter.channel) {
      case AudioChannel.Left:
        this.audioService.setAllVolume([vol, fixedVolLevel]);
        break;
      case AudioChannel.Right:
        this.audioService.setAllVolume([fixedVolLevel, vol]);
        break;
      case AudioChannel.Mono:
        this.audioService.setAllVolume(vol);
        break;
      default:
        this.bekesyResponseParameter.channel satisfies never;
        break;
    }
  }
}
