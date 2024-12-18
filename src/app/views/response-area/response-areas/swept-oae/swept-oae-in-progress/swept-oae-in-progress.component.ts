import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DevicesService } from '../../../../../controllers/devices.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import * as d3 from 'd3';
import { DPOAEDataInterface, SweptOaeResultsInterface } from '../swept-oae-exam/sept-oae-exam.interface';
import { Logger } from '../../../../../utilities/logger.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { sweptOaeSchema } from '../../../../../../schema/response-areas/swept-oae.schema';
import { createLegend, createOAEResultsChartSvg } from '../../../../../utilities/d3-plot-functions';

@Component({
  selector: 'swept-oae-in-progress',
  templateUrl: './swept-oae-in-progress.component.html',
  styleUrl: './swept-oae-in-progress.component.css'
})
export class SweptOaeInProgressComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() device: ConnectedDevice | undefined;
  @Input() f2Start: number = sweptOaeSchema.properties.f2Start.default;
  @Input() f2End: number = sweptOaeSchema.properties.f2End.default;
  @Input() xScale!: d3.ScaleLogarithmic<number, number, never>;
  @Input() yScale!: d3.ScaleLinear<number, number, never>;
  @Input() width!: number;
  @Input() height!: number;
  @Input() xTicks!: number[];
  @Input() margin!: { top: number, right: number, bottom: number, left: number };
  @Output() sweptOAEResultsEvent = new EventEmitter<SweptOaeResultsInterface>();

  state: StateInterface;
  inProgressResults: SweptOaeResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  inProgressResultsSubject = new BehaviorSubject<SweptOaeResultsInterface>(this.inProgressResults);
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
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe((updatedResults: SweptOaeResultsInterface) => {
      if (updatedResults.DpLow) {
        this.updatePlot(updatedResults.DpLow);
      }
      this.inProgressResults = updatedResults;
      this.inProgressResults.PctComplete = Math.round(this.inProgressResults.PctComplete);
    });
  }

  ngAfterViewInit(): void {
    this.svg = this.createProgressPlot();
  }
  ngOnDestroy(): void {
    this.state.isSubmittable = true;
  }

  async abort() {
    this.shouldAbort = true;
    while (this.isRequestingResults) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }  
    this.instructions = "Exam aborted, press 'Next' to continue.";
    this.changeDetectorRef.detectChanges();
    await this.devicesService.abortExams(this.device!);
    this.state.isSubmittable = true;
    this.sweptOAEResultsEvent.emit(this.inProgressResults);
    this.inProgressResults.State = 'ABORTED';
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
          this.sweptOAEResultsEvent.emit(resp![1]);
          this.instructions = "Exam complete, press 'Next' to continue."
          this.changeDetectorRef.detectChanges();
          return;
        }
      } else {
        this.logger.debug('Swept OAE in-progress component. Request results did not return expected results.');
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
           resp[1] !== 'OK';
  }

  private createProgressPlot() {
    let svg = d3.select('#oae-in-progress-plot')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);;
    
    svg = createOAEResultsChartSvg(svg, this.width, this.height, this.xTicks, this.xScale, this.yScale);

    const legendData = [
      { label: 'OAE', color: 'blue', symbol: 'circle' },
      { label: 'NF', color: 'red', symbol: 'X' }
    ];

    createLegend(svg, legendData, this.width, 80);

    return svg;
    
  }

  private updatePlot(data: DPOAEDataInterface) {
    const filteredData = this.filterData(data);

    // Plot DpLow Amplitude / OAE (blue open circles)
    this.svg.selectAll('.dot')
      .data(filteredData.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => this.xScale(filteredData.Frequency[i]))
      .attr('cy', (d, i) => this.yScale(filteredData.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    // Plot DpLow NoiseFloor (red X)
    this.svg.selectAll('.cross')
      .data(filteredData.Frequency)
      .enter()
      .append('text')
      .attr('x', (d, i) => this.xScale(filteredData.Frequency[i]))
      .attr('y', (d, i) => this.yScale(filteredData.NoiseFloor[i]))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('fill', 'red')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('X');

  }

  private filterData(data: DPOAEDataInterface) {
    const validIndices = data.Frequency
      .map((freq, index) => (freq >= 500 && freq <= 16000 ? index : -1))
      .filter(index => index !== -1);
  
    return {
      Frequency: validIndices.map(index => data.Frequency[index]),
      Amplitude: validIndices.map(index => data.Amplitude[index]),
      Phase: validIndices.map(index => data.Phase[index]),
      NoiseFloor: validIndices.map(index => data.NoiseFloor![index]),
    };
  }

}
