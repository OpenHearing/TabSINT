import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, Subscription } from 'rxjs';

import { DevicesService } from '../../../../../controllers/devices.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { DPOAEDataInterface, SweptDpoaeResultsInterface } from '../swept-dpoae-exam/swept-dpoae-exam.interface';
import { Logger } from '../../../../../utilities/logger.service';
import { createLegend, createOAEResultsChartSvg } from '../../../../../utilities/d3-plot-functions';
import { sweptDpoaeSchema } from '../../../../../../schema/response-areas/swept-dpoae.schema';

@Component({
  selector: 'swept-dpoae-in-progress',
  templateUrl: './swept-dpoae-in-progress.component.html',
  styleUrl: './swept-dpoae-in-progress.component.css'
})
export class SweptDpoaeInProgressComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() device: ConnectedDevice | undefined;
  @Input() f2Start: number = sweptDpoaeSchema.properties.f2Start.default;
  @Input() f2End: number = sweptDpoaeSchema.properties.f2End.default;
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() yScale!: d3.ScaleLinear<number, number, never>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() xTicks!: number[];
  @Input() margin!: { top: number, right: number, bottom: number, left: number };
  @Output() sweptDPOAEResultsEvent = new EventEmitter<SweptDpoaeResultsInterface>();

  state: StateInterface;
  inProgressResults: SweptDpoaeResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  inProgressResultsSubject = new BehaviorSubject<SweptDpoaeResultsInterface>(this.inProgressResults);
  inProgressResultsSubscription: Subscription | undefined;
  svg!: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  shouldAbort: boolean = false;
  isRequestingResults: boolean = false;
  instructions: string = "Exam in progress please wait.";

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly devicesService: DevicesService,
    private readonly logger: Logger, 
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.state.isSubmittable = false;
  }

  async ngOnInit(): Promise<void> {
    this.requestResults();
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: SweptDpoaeResultsInterface) => {
      if (updatedResults.DpLow && updatedResults.F2) {
        this.updatePlot(updatedResults.DpLow, updatedResults.F2);
      }
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngAfterViewInit(): void {
    this.svg = this.createProgressPlot();
  }

  ngOnDestroy(): void {
    this.inProgressResultsSubscription?.unsubscribe();
    this.state.isSubmittable = true;
    this.shouldAbort = true;
  }

  async abort() {
    this.shouldAbort = true;
    this.updateInstructionsAfterAbortButtonPressed();
    await this.waitForRequestResultsDone();
    await this.devicesService.abortExams(this.device!);
    this.updateInstructionsAfterAbortComplete();
    this.updateStateOnAbort();
    this.sweptDPOAEResultsEvent.emit(this.inProgressResults);
  }

  private async requestResults() {
    const pollResults = async () => {
      if (this.shouldAbort) return;

      this.isRequestingResults = true;
      let resp = await this.devicesService.requestResults(this.device!, 300000);
      this.isRequestingResults = false;

      if (this.shouldAbort) return;
  
      if (this.doesRespContainResults(resp)) {
        this.inProgressResultsSubject.next(resp![1]);
        if (this.inProgressResults.State === 'DONE') {
          this.state.isSubmittable = true;
          this.sweptDPOAEResultsEvent.emit(resp![1]);
          this.instructions = "Exam complete, press 'Next' to continue."
          this.changeDetectorRef.detectChanges();
          return;
        }
      } else {
        this.logger.debug('Swept DPOAE in-progress component. Request results did not return expected results. It may be too early to receive results.');
      }
  
      setTimeout(pollResults, 1000);
    };
  
    pollResults();
  }

  private doesRespContainResults(resp: any[] | undefined) {
    return resp !== undefined && 
           resp.length > 1 && 
           resp[1] !== 'ERROR' && 
           resp[2] !== 'timeout' &&
           resp[2] !== 'byte timeout' &&
           resp[1] !== 'OK';
  }

  private createProgressPlot() {
    let svg = d3.select('#dpoae-in-progress-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);;
    
    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, this.yScale);

    const legendData = [
      { label: 'DPOAE', color: 'blue', symbol: 'circle' },
      { label: 'NF', color: 'red', symbol: 'X' }
    ];

    createLegend(svg, legendData, this.width, 85);

    return svg;
  }

  private updatePlot(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    const filteredData = this.filterData(dpLowData, f2Data);

    // Plot DpLow Amplitude / DPOAE (blue open circles)
    this.svg.selectAll('.dot')
      .data(filteredData['F2Frequency'])
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData['F2Frequency'][i]))
      .attr('cy', (d, i) => this.yScale(filteredData['Amplitude'][i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    // Plot DpLow NoiseFloor (red X)
    this.svg.selectAll('.cross')
      .data(filteredData['F2Frequency'])
      .enter()
      .append('text')
      .attr('x', (d, i) => this.xScale(filteredData['F2Frequency'][i]))
      .attr('y', (d, i) => this.yScale(filteredData['NoiseFloor'][i]))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('fill', 'red')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('X');

  }

  private filterData(dpLowData: DPOAEDataInterface, f2Data: DPOAEDataInterface) {
    let filteredData: { [key: string]: number[] } = {
      Frequency: [],
      F2Frequency: [],
      Amplitude: [],
      NoiseFloor: [],
    };
    for (let i = 0; i < dpLowData.Frequency.length; i++) {
      const freq = dpLowData.Frequency[i];
      filteredData['Frequency'].push(freq);
      filteredData['F2Frequency'].push(f2Data.Frequency[i]);
      filteredData['Amplitude'].push(dpLowData.Amplitude[i]);
      if (dpLowData['NoiseFloor'] && filteredData['NoiseFloor']) {
        filteredData['NoiseFloor'].push(dpLowData.NoiseFloor[i]);
      }
    }
    return filteredData
  }

  private async waitForRequestResultsDone() {
    while (this.isRequestingResults) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }  
  }

  private updateInstructionsAfterAbortButtonPressed() {
    this.instructions = "Abort pressed, please wait while exam is aborted.";
    this.changeDetectorRef.detectChanges();
  }

  private updateInstructionsAfterAbortComplete() {
    this.instructions = "Exam aborted, press 'Next' to continue.";
    this.changeDetectorRef.detectChanges();
  }

  private updateStateOnAbort() {
    this.state.isSubmittable = true;
    this.inProgressResults.State = 'ABORTED';
    this.shouldAbort = false;
  }

}
