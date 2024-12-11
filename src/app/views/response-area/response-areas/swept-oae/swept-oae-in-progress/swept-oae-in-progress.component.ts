import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { DevicesService } from '../../../../../controllers/devices.service';
import { ConnectedDevice } from '../../../../../interfaces/connected-device.interface';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import * as d3 from 'd3';
import { PageModel } from '../../../../../models/page/page.service';
import { SweptOaeResultsInterface } from '../swept-oae-exam/sept-oae-exam.interface';
import { final_dummy_results } from '../swept-oae-results/dummy-results';
import { Logger } from '../../../../../utilities/logger.service';
import { BehaviorSubject, Subscription } from 'rxjs';

interface DPOAEDataInterface {
  Frequency: number[];
  Amplitude: number[];
  Phase: number[];
  NoiseFloor: number[];
}

@Component({
  selector: 'swept-oae-in-progress',
  templateUrl: './swept-oae-in-progress.component.html',
  styleUrl: './swept-oae-in-progress.component.css'
})
export class SweptOaeInProgressComponent implements OnInit, OnDestroy {
  @Input() device: ConnectedDevice | undefined;
  @Output() sweptOAEResultsEvent = new EventEmitter<SweptOaeResultsInterface>();
  private intervalId: ReturnType<typeof setInterval> | undefined;
  state: StateInterface;
  svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | undefined;
  inProgressResults: SweptOaeResultsInterface = {
    State: 'READY',
    PctComplete: 0
  };
  inProgressResultsSubject = new BehaviorSubject<SweptOaeResultsInterface>(this.inProgressResults);
  inProgressResultsSubscription: Subscription | undefined;

  constructor(
    private readonly devicesService: DevicesService,
    private readonly logger: Logger, 
    private readonly pageModel: PageModel,
    private readonly stateModel: StateModel,
  ) {
    this.state = this.stateModel.getState();
    this.state.isSubmittable = false;
  }

  async ngOnInit(): Promise<void> {
    this.createProgressPlot();
    this.requestResults();
    this.inProgressResultsSubscription = this.inProgressResultsSubject.subscribe(() => {
      this.updatePlot();
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  abort() {
    // let resp = await this.devicesService.abortExams(this.device!);
    // console.log("resp from tympan after swept OAE exam abort exams:",resp);
    // save partial results
  }

  private async requestResults() {
    this.intervalId = setInterval(async () => {
      let resp = await this.devicesService.requestResults(this.device!);
      // let resp: [number, SweptOaeResultsInterface] = [-46, final_dummy_results];
      if (resp !== undefined && resp.length > 1) {
        this.inProgressResultsSubject.next(resp[1]);
        if (this.inProgressResults.State === 'DONE') {
          this.state.isSubmittable = true;
          this.sweptOAEResultsEvent.emit(resp[1]);
          clearInterval(this.intervalId);
        }
      } else {
        this.logger.debug('Swept OAE in-progress component. Request results did not return expected results.');
      }
    }, 1000);
  }

  private createProgressPlot() {
    const data = this.dummyResult.DpLow;

    // Set dimensions and margins
    const margin = { top: 20, right: 30, bottom: 60, left: 70 };
    const width = 450 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const xTicks = [500, 1000, 2000, 4000, 8000, 16000];

    // Create SVG container
    this.svg = d3.select('#oae-amplitude-plot')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scaleLog()
      .domain([500, 16000])
      .range([0, width]);

    const filteredData = this.filterData(data);

    const yScale = d3.scaleLinear()
      .domain([d3.min([...filteredData.Amplitude, ...filteredData.NoiseFloor]) as number, d3.max([...filteredData.Amplitude, ...filteredData.NoiseFloor]) as number])
      .range([height, 0]);

    // Define axes
    const xAxisMinor = d3.axisBottom(xScale).ticks(10).tickFormat(() => '');
    const xAxis = d3.axisBottom(xScale).tickValues(xTicks) .tickFormat(d => {
      const value = +d
      if (value >= 1000) {
        return `${value / 1000}k`; // Convert to 'k' format for thousands
      }
      return `${value}`; // Display as is for values below 1000
    });
    const yAxis = d3.axisLeft(yScale);

    // Append axes
    this.svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis-label')
      .call(xAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', width / 2)
      .attr('y', 50)
      .style('text-anchor', 'middle')
      .attr('fill', 'black')
      .text('Frequency (Hz)');

    this.svg.append('g')
    .attr('class', 'axis-label')
      .call(yAxis)
      .append('text')
      .attr('class', 'label')
      .attr('font-size', 20)
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('transform', 'rotate(-90)')
      .attr('fill', 'black')
      .style('text-anchor', 'middle')
      .text('Amplitude (dB SPL)');

    // Major X Axis Gridlines
    this.svg
      .append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(xAxisMinor.tickSize(height).tickFormat(() => ""));

    // Major Y Axis gridlines
    this.svg
      .append("g")
      .attr("class", "grid")
      .style("stroke-dasharray", "1,3")
      .style("stroke-opacity", "0.5")
      .call(yAxis.ticks(10).tickSize(-width).tickFormat(() => ""));

    this.svg.selectAll('.axis-label .tick text')
      .attr('font-size', 16) // Set font size for tick labels
      .style('fill', 'black'); // Optionally, ensure the color is correct

    // Border around chart
    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', height)
      .attr('width', width)
      .style('stroke', 'black')
      .style('fill', 'none')
      .style('stroke-width', 2);
  
    // Plot DpLow Amplitude (blue open circles)
    this.svg.selectAll('.dot')
      .data(filteredData.Frequency)
      .enter()
      .append('circle')
      .attr('cx', (d, i) => xScale(filteredData.Frequency[i]))
      .attr('cy', (d, i) => yScale(filteredData.Amplitude[i]))
      .attr('r', 4)
      .style('fill', 'none')
      .style('stroke', 'blue')
      .style('stroke-width', 2);

    // Plot DpLow NoiseFloor (red X)
    this.svg.selectAll('.cross')
      .data(filteredData.Frequency)
      .enter()
      .append('text')
      .attr('x', (d, i) => xScale(filteredData.Frequency[i]))
      .attr('y', (d, i) => yScale(filteredData.NoiseFloor[i]))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('fill', 'red')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('X');

    // Define the legend data
    const legendData = [
      { label: 'DPOAE', color: 'blue', symbol: 'circle' },
      { label: 'Noise', color: 'red', symbol: 'X' }
    ];

    // Append the legend group
    const legend = this.svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 65}, 15)`); // Position legend in the upper-right corner

    // Add a background box for the legend
    legend.append('rect')
      .attr('class', 'legend-box')
      .attr('x', -10) // Add some padding
      .attr('y', -10)
      .attr('width', 70) 
      .attr('height', legendData.length * 20 ) // Adjust height dynamically
      .style('fill', 'white')
      .style('stroke', 'black')
      .style('stroke-width', 1)
      .style('rx', 5) // Rounded corners 
      .style('ry', 5);

    // Add legend items
    legend.selectAll('.legend-item')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`) // Space items vertically
    .each(function (d) {
      const group = d3.select(this);

      // Add symbol (circle or X)
      if (d.symbol === 'circle') {
        group.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 5)
          .style('fill', 'none')
          .style('stroke', d.color)
          .style('stroke-width', 2);
      } else if (d.symbol === 'X') {
        const size = 5; // Size of the "X"
        group.append('line')
          .attr('x1', -size)
          .attr('y1', -size)
          .attr('x2', size)
          .attr('y2', size)
          .style('stroke', d.color)
          .style('stroke-width', 2);

        group.append('line')
          .attr('x1', -size)
          .attr('y1', size)
          .attr('x2', size)
          .attr('y2', -size)
          .style('stroke', d.color)
          .style('stroke-width', 2);
      }

      // Add label
      group.append('text')
        .attr('x', 15) // Offset the label to the right of the symbol
        .attr('y', 5) // Vertically center the text
        .style('font-size', '12px')
        .style('fill', 'black')
        .text(d.label);
    });
  }

  private filterData(data: DPOAEDataInterface) {
    const validIndices = data.Frequency
      .map((freq, index) => (freq >= 500 && freq <= 16000 ? index : -1))
      .filter(index => index !== -1);
  
    return {
      Frequency: validIndices.map(index => data.Frequency[index]),
      Amplitude: validIndices.map(index => data.Amplitude[index]),
      Phase: validIndices.map(index => data.Phase[index]),
      NoiseFloor: validIndices.map(index => data.NoiseFloor[index]),
    };
  }

}
