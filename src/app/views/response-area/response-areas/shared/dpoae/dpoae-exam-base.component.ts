import { Directive, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

import { PageModel } from '../../../../../models/page/page.service';
import { DevicesService } from '../../../../../services/devices/devices.service';
import { Logger } from '../../../../../services/logger.service';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { ButtonTextService } from '../../../../../controllers/button-text.service';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { DeviceType } from '../../../../../utilities/constants';
import { NormativeDataInterface } from '../../../../../interfaces/normative-data-interface';
import { DpoaeCommonInterface, DpoaeResultsCommonInterface } from './dpoae-common.interface';

/**
 * Common properties shared by both the swept-dpoae and dp-gram schema `properties` objects
 * (both spread `dpoaeCommonSchemaProperties`, so either concrete schema's `properties` object
 * satisfies this shape). Used to seed default values in the constructor.
 */
export type DpoaeCommonSchemaProperties = {
  [K in keyof Required<DpoaeCommonInterface>]: { default?: DpoaeCommonInterface[K] };
};

/**
 * Shared base for the top-level exam container component of a DPOAE-family response area
 * (currently Swept DPOAE and DP-gram). Holds the step machine, device/results plumbing, and
 * examService wiring that is identical across both; subclasses supply the response-area-specific
 * field handling, exam-property construction, and plot scale setup.
 */
@Directive()
export abstract class DpoaeExamBaseComponent<TResponseArea extends DpoaeCommonInterface, TResults extends DpoaeResultsCommonInterface>
  implements OnInit, OnDestroy
{
  protected readonly resultsModel = inject(ResultsModel);
  protected readonly pageModel = inject(PageModel);
  protected readonly logger = inject(Logger);
  protected readonly examService = inject(ExamService);
  protected readonly devicesService = inject(DevicesService);
  protected readonly buttonTextService = inject(ButtonTextService);

  tabsintId: string;
  outputCalibrationType: string;
  outputChannel1: string;
  outputChannel2: string;
  inputChannel: string;
  ratio: number;
  l1: number;
  l2: number;
  noiseFloorThreshold: number;
  SNRThreshold: number;
  recordFileFolder: string | undefined;
  outputRawMeasurements: boolean;
  showResults: boolean;
  normativeDataPath: string;
  normativeData: NormativeDataInterface[];
  autoSubmit: boolean;

  results: ResultsInterface;
  pageSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  currentStep: string = 'input-parameters';
  device: IDevice | undefined;
  examResults: TResults;
  inputParameterMap = new Map<string, string>();
  allowableDevices = [DeviceType.Tympan];

  // Set default dimensions and margins
  margin = { top: 20, right: 30, bottom: 60, left: 70 };
  width = 450 - this.margin.left - this.margin.right;
  height = 300 - this.margin.top - this.margin.bottom;

  protected abstract readonly responseAreaType: string;
  protected abstract readonly examLabel: string;

  protected constructor(commonSchemaProperties: DpoaeCommonSchemaProperties) {
    this.tabsintId = commonSchemaProperties.tabsintId.default as string;
    this.outputCalibrationType = commonSchemaProperties.outputCalibrationType.default as string;
    this.outputChannel1 = commonSchemaProperties.outputChannel1.default as string;
    this.outputChannel2 = commonSchemaProperties.outputChannel2.default as string;
    this.inputChannel = commonSchemaProperties.inputChannel.default as string;
    this.ratio = commonSchemaProperties.ratio.default as number;
    this.l1 = commonSchemaProperties.l1.default as number;
    this.l2 = commonSchemaProperties.l2.default as number;
    this.noiseFloorThreshold = commonSchemaProperties.noiseFloorThreshold.default as number;
    this.SNRThreshold = commonSchemaProperties.SNRThreshold.default as number;
    this.recordFileFolder = commonSchemaProperties.recordFileFolder.default;
    this.outputRawMeasurements = commonSchemaProperties.outputRawMeasurements.default as boolean;
    this.showResults = commonSchemaProperties.showResults.default as boolean;
    this.normativeDataPath = commonSchemaProperties.normativeDataPath.default as string;
    this.normativeData = commonSchemaProperties.normativeData.default ?? [];
    this.autoSubmit = commonSchemaProperties.autoSubmit.default as boolean;

    this.examResults = { State: 'READY', PctComplete: 0 } as TResults;
    this.results = this.resultsModel.getResults();

    this.examService.submit = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.nextStep();
      }
    };
    this.examService.reset = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.resetDefault();
      }
    };
    this.examService.submitPartial = () => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.submitPartialDefault();
      }
    };
    this.examService.navigateToTarget = subProtocolId => {
      if (!this.devicesService.isDeviceMessagePending(this.device)) {
        this.examService.navigateToTargetDefault(subProtocolId);
      }
    };
  }

  ngOnInit(): void {
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type === this.responseAreaType) {
        this.applyResponseArea(updatedPage.responseArea as TResponseArea);
      }
    });
  }

  ngOnDestroy(): void {
    this.asyncNgOnDestroy();
    this.examService.submit = this.examService.submitDefault.bind(this.examService);
    this.examService.reset = this.examService.resetDefault.bind(this.examService);
    this.examService.submitPartial = this.examService.submitPartialDefault.bind(this.examService);
    this.examService.navigateToTarget = this.examService.navigateToTargetDefault.bind(this.examService);
    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.buttonTextService.updateButtonText('Submit');
  }

  /**
   * Function to be called by ngOnDestroy to handle any asynchronous operations.
   */
  private async asyncNgOnDestroy(): Promise<void> {
    await this.devicesService.abortExams(this.device!);
  }

  async nextStep(): Promise<void> {
    switch (this.currentStep) {
      case 'input-parameters':
        await this.beginExam();
        this.currentStep = 'in-progress';
        this.buttonTextService.updateButtonText('Next');
        break;
      case 'in-progress':
        this.currentStep = 'results';
        this.buttonTextService.updateButtonText('Finish');
        if (this.autoSubmit) {
          this.examService.submit();
        }
        break;
      case 'results':
        this.examService.submitDefault();
        break;
    }
  }

  saveResults(results: TResults): void {
    this.examResults = results;
    this.resultsModel.updateCurrentPage({ response: results });
  }

  /**
   * Resolves the target device for this exam, surfacing the standard not-found error/log if none
   * is available. Subclasses call this from beginExam() before building their exam-specific properties.
   */
  protected async resolveDevice(): Promise<IDevice | undefined> {
    const deviceList = await this.devicesService.getDeviceOrDefault(this.tabsintId, this.allowableDevices);
    const device = await this.devicesService.confirmSingleDevice(deviceList);
    if (!device) {
      await this.devicesService.deviceNotFound();
      this.logger.error(`Error setting up ${this.examLabel} exam`);
    }
    return device;
  }

  /**
   * Copies every DpoaeCommonInterface field from the incoming response area, falling back to the
   * current value when a field is unset. Subclasses call this first from applyResponseArea() before
   * handling their own response-area-specific fields.
   */
  protected applyCommonFields(responseArea: DpoaeCommonInterface): void {
    // Note: exportToCSV, showResults, and autoSubmit are deliberately NOT re-read here, matching
    // today's swept behavior - they're seeded once from schema defaults in the constructor and
    // never re-applied from a live responseArea.
    this.tabsintId = responseArea.tabsintId ?? this.tabsintId;
    this.outputCalibrationType = responseArea.outputCalibrationType ?? this.outputCalibrationType;
    this.outputChannel1 = responseArea.outputChannel1 ?? this.outputChannel1;
    this.outputChannel2 = responseArea.outputChannel2 ?? this.outputChannel2;
    this.inputChannel = responseArea.inputChannel ?? this.inputChannel;
    this.ratio = responseArea.ratio ?? this.ratio;
    this.l1 = responseArea.l1 ?? this.l1;
    this.l2 = responseArea.l2 ?? this.l2;
    this.noiseFloorThreshold = responseArea.noiseFloorThreshold ?? this.noiseFloorThreshold;
    this.SNRThreshold = responseArea.SNRThreshold ?? this.SNRThreshold;
    this.recordFileFolder = responseArea.recordFileFolder ?? this.recordFileFolder;
    this.outputRawMeasurements = responseArea.outputRawMeasurements ?? this.outputRawMeasurements;
    this.normativeDataPath = responseArea.normativeDataPath ?? this.normativeDataPath;
    this.normativeData = responseArea.normativeData ?? this.normativeData;
  }

  protected abstract applyResponseArea(responseArea: TResponseArea): void;
  protected abstract beginExam(): Promise<void>;
}
